package com.phrasesdetective.backend.repository;

import com.phrasesdetective.backend.dto.PhraseQuestionDto;
import com.phrasesdetective.backend.dto.AdminPhraseDto;
import com.phrasesdetective.backend.dto.PhraseUpsertRequest;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Repository;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Repository
public class PhraseRepository {
  private final Database database;

  public PhraseRepository(Database database) {
    this.database = database;
  }

  public List<PhraseQuestionDto> randomQuestions(String difficulty, int limit) {
    List<PhraseQuestionDto> result = new ArrayList<>();
    String sql = "SELECT phrase, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3 " +
        "FROM phrases WHERE difficulty = ? ORDER BY RAND() LIMIT ?";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setString(1, difficulty.toUpperCase());
      statement.setInt(2, limit);
      try (ResultSet rows = statement.executeQuery()) {
        while (rows.next()) {
          String correct = rows.getString("correct_answer");
          List<String> options = new ArrayList<>();
          options.add(correct);
          options.add(rows.getString("wrong_answer_1"));
          options.add(rows.getString("wrong_answer_2"));
          options.add(rows.getString("wrong_answer_3"));
          Collections.shuffle(options);
          result.add(new PhraseQuestionDto(
              rows.getString("phrase"),
              "Šta ova fraza znači?",
              options,
              options.indexOf(correct)
          ));
        }
      }
      if (result.size() < limit) throw new IllegalStateException("Nema dovoljno fraza za težinu " + difficulty + ".");
      return result;
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot load phrase questions", ex);
    }
  }

  public List<AdminPhraseDto> search(String query) {
    List<AdminPhraseDto> result = new ArrayList<>();
    String search = "%" + (query == null ? "" : query.trim().toLowerCase()) + "%";
    String sql = "SELECT id, phrase, category, difficulty, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3 " +
        "FROM phrases WHERE LOWER(phrase) LIKE ? OR LOWER(difficulty) LIKE ? OR LOWER(correct_answer) LIKE ? " +
        "OR LOWER(wrong_answer_1) LIKE ? OR LOWER(wrong_answer_2) LIKE ? OR LOWER(wrong_answer_3) LIKE ? " +
        "ORDER BY difficulty, phrase LIMIT 500";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      for (int i = 1; i <= 6; i++) statement.setString(i, search);
      try (ResultSet rows = statement.executeQuery()) {
        while (rows.next()) result.add(mapAdminPhrase(rows));
      }
      return result;
    } catch (Exception ex) {
      throw new IllegalStateException("Ne mogu da učitam fraze.", ex);
    }
  }

  public AdminPhraseDto create(PhraseUpsertRequest request) {
    String sql = "INSERT INTO phrases (phrase, category, difficulty, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)";
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement(sql, PreparedStatement.RETURN_GENERATED_KEYS)) {
      bindPhrase(statement, request);
      statement.executeUpdate();
      try (ResultSet keys = statement.getGeneratedKeys()) {
        if (keys.next()) return findById(keys.getLong(1));
      }
      throw new IllegalStateException("Fraza je sačuvana, ali nije moguće pročitati njen ID.");
    } catch (java.sql.SQLIntegrityConstraintViolationException ex) {
      throw new IllegalArgumentException("Fraza sa tim nazivom već postoji.");
    } catch (Exception ex) {
      throw new IllegalStateException("Ne mogu da dodam frazu.", ex);
    }
  }

  public AdminPhraseDto update(long id, PhraseUpsertRequest request) {
    String sql = "UPDATE phrases SET phrase = ?, category = ?, difficulty = ?, correct_answer = ?, " +
        "wrong_answer_1 = ?, wrong_answer_2 = ?, wrong_answer_3 = ? WHERE id = ?";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      bindPhrase(statement, request);
      statement.setLong(8, id);
      if (statement.executeUpdate() == 0) throw new IllegalArgumentException("Fraza nije pronađena.");
      return findById(id);
    } catch (java.sql.SQLIntegrityConstraintViolationException ex) {
      throw new IllegalArgumentException("Fraza sa tim nazivom već postoji.");
    } catch (IllegalArgumentException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalStateException("Ne mogu da izmijenim frazu.", ex);
    }
  }

  public void delete(long id) {
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement("DELETE FROM phrases WHERE id = ?")) {
      statement.setLong(1, id);
      if (statement.executeUpdate() == 0) throw new IllegalArgumentException("Fraza nije pronađena.");
    } catch (IllegalArgumentException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalStateException("Ne mogu da obrišem frazu.", ex);
    }
  }

  private AdminPhraseDto findById(long id) {
    String sql = "SELECT id, phrase, category, difficulty, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3 FROM phrases WHERE id = ?";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      statement.setLong(1, id);
      try (ResultSet row = statement.executeQuery()) {
        if (row.next()) return mapAdminPhrase(row);
      }
      throw new IllegalArgumentException("Fraza nije pronađena.");
    } catch (IllegalArgumentException ex) {
      throw ex;
    } catch (Exception ex) {
      throw new IllegalStateException("Ne mogu da učitam frazu.", ex);
    }
  }

  private void bindPhrase(PreparedStatement statement, PhraseUpsertRequest request) throws Exception {
    statement.setString(1, request.getPhrase());
    statement.setString(2, request.getCategory());
    statement.setString(3, request.getDifficulty());
    statement.setString(4, request.getCorrectAnswer());
    statement.setString(5, request.getWrongAnswer1());
    statement.setString(6, request.getWrongAnswer2());
    statement.setString(7, request.getWrongAnswer3());
  }

  private AdminPhraseDto mapAdminPhrase(ResultSet row) throws Exception {
    return new AdminPhraseDto(row.getLong("id"), row.getString("phrase"), row.getString("category"),
        row.getString("difficulty"), row.getString("correct_answer"), row.getString("wrong_answer_1"),
        row.getString("wrong_answer_2"), row.getString("wrong_answer_3"));
  }

  @PostConstruct
  public void seed() {
    if (hasPhrases()) return;
    String[][] rows = seedRows();
    String sql = "INSERT INTO phrases (phrase, category, difficulty, correct_answer, wrong_answer_1, wrong_answer_2, wrong_answer_3) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE category = VALUES(category), difficulty = VALUES(difficulty), " +
        "correct_answer = VALUES(correct_answer), wrong_answer_1 = VALUES(wrong_answer_1), wrong_answer_2 = VALUES(wrong_answer_2), wrong_answer_3 = VALUES(wrong_answer_3)";
    try (Connection connection = database.connection(); PreparedStatement statement = connection.prepareStatement(sql)) {
      for (String[] row : rows) {
        for (int i = 0; i < row.length; i++) statement.setString(i + 1, row[i]);
        statement.addBatch();
      }
      statement.executeBatch();
    } catch (Exception ex) {
      throw new IllegalStateException("Cannot seed phrases", ex);
    }
  }

  private boolean hasPhrases() {
    try (Connection connection = database.connection();
         PreparedStatement statement = connection.prepareStatement("SELECT 1 FROM phrases LIMIT 1");
         ResultSet rows = statement.executeQuery()) {
      return rows.next();
    } catch (Exception ex) {
      throw new IllegalStateException("Ne mogu da provjerim početne fraze.", ex);
    }
  }

  private String[][] seedRows() {
    return new String[][] {
        {"Break a leg", "Svakodnevno", "EASY", "Srećno", "Povrijedi se", "Trči brzo", "Odustani odmah"},
        {"Piece of cake", "Posao", "EASY", "Nešto veoma lako", "Skup obrok", "Težak zadatak", "Sladak poklon"},
        {"Spill the beans", "Razgovor", "EASY", "Otkriti tajnu", "Prosuti hranu", "Sakriti dokaz", "Skuvati ručak"},
        {"Hit the road", "Putovanje", "EASY", "Krenuti na put", "Popraviti ulicu", "Pasti na testu", "Voziti prebrzo"},
        {"Call it a day", "Posao", "EASY", "Završiti posao za danas", "Planirati dan", "Nazvati nekoga", "Kasniti na sastanak"},
        {"Under the weather", "Zdravlje", "EASY", "Biti bolestan", "Stajati na kiši", "Gledati prognozu", "Putovati avionom"},
        {"No worries", "Razgovor", "EASY", "Nema problema", "Mnogo briga", "Nema vremena", "Ne sjećam se"},
        {"Keep an eye on", "Svakodnevno", "EASY", "Paziti na nešto", "Zatvoriti oči", "Ignorisati problem", "Kupiti naočare"},
        {"Better late than never", "Vrijeme", "EASY", "Bolje ikad nego nikad", "Nikad ne kasni", "Vrijeme je novac", "Kasno je uvijek loše"},
        {"Once in a blue moon", "Vrijeme", "EASY", "Veoma rijetko", "Svake noći", "U velikoj žurbi", "Bez razloga"},
        {"Let me know", "Razgovor", "EASY", "Javi mi", "Pusti me", "Zaboravi to", "Ne pitaj me"},
        {"I am all ears", "Razgovor", "EASY", "Pažljivo slušam", "Ne čujem dobro", "Veoma sam ljut", "Spreman sam da idem"},
        {"So far so good", "Svakodnevno", "EASY", "Za sada je dobro", "Predaleko je", "Sve je gotovo", "Nije počelo"},
        {"Give it a try", "Svakodnevno", "EASY", "Pokušaj", "Pokloni to", "Odloži to", "Prekini odmah"},
        {"Take care", "Razgovor", "EASY", "Čuvaj se", "Uzmi brigu", "Budi strog", "Ponesi stvari"},
        {"Hang out", "Druženje", "EASY", "Družiti se", "Objesiti nešto", "Odustati", "Sakriti se"},
        {"Calm down", "Emocije", "EASY", "Smiri se", "Požuri", "Govori glasnije", "Promijeni temu"},
        {"Find out", "Učenje", "EASY", "Saznati", "Izaći napolje", "Izgubiti nešto", "Pronaći novac"},
        {"Look forward to", "Planovi", "EASY", "Radovati se nečemu", "Gledati pravo", "Zaboraviti dogovor", "Vratiti se nazad"},
        {"Run out of", "Svakodnevno", "EASY", "Ostati bez nečega", "Istrčati napolje", "Potpuno pobijediti", "Potrošiti previše"},
        {"Bite the bullet", "Odluke", "MEDIUM", "Prihvatiti nešto teško", "Napraviti grešku", "Kupiti oružje", "Prekinuti raspravu"},
        {"Cut corners", "Posao", "MEDIUM", "Raditi površno da se uštedi", "Urediti sobu", "Pobijediti u trci", "Promijeniti pravac"},
        {"On thin ice", "Rizik", "MEDIUM", "U rizičnoj situaciji", "Na zimovanju", "Veoma smiren", "Bez dokaza"},
        {"Go the extra mile", "Trud", "MEDIUM", "Dodatno se potruditi", "Putovati dalje", "Kasniti namjerno", "Zaobići pravila"},
        {"A blessing in disguise", "Sreća", "MEDIUM", "Skrivena sreća u lošem događaju", "Maskirana osoba", "Lažno obećanje", "Brza odluka"},
        {"The ball is in your court", "Odluke", "MEDIUM", "Na tebi je da odlučiš", "Igraš sport", "Propustio si šansu", "Neko te krivi"},
        {"Burn bridges", "Odnosi", "MEDIUM", "Uništiti odnose", "Započeti putovanje", "Sakriti tragove", "Raditi noću"},
        {"Miss the boat", "Prilike", "MEDIUM", "Propustiti priliku", "Putovati brodom", "Izgubiti kartu", "Promašiti cilj"},
        {"Pull yourself together", "Emocije", "MEDIUM", "Saberi se", "Udruži se sa nekim", "Povuci nešto jako", "Odmori se"},
        {"Take it with a grain of salt", "Savjeti", "MEDIUM", "Ne vjerovati potpuno", "Dodati začine", "Prihvatiti savjet odmah", "Ljutiti se"},
        {"Get cold feet", "Emocije", "MEDIUM", "Uplašiti se pred odluku", "Smrznuti se", "Hodati bos", "Kasniti zbog vremena"},
        {"Hit the nail on the head", "Procjena", "MEDIUM", "Tačno pogoditi suštinu", "Povrijediti se", "Popraviti zid", "Raditi fizički posao"},
        {"Out of the blue", "Iznenađenje", "MEDIUM", "Iznenada", "Veoma tužno", "Bez boje", "Na otvorenom"},
        {"Up in the air", "Planovi", "MEDIUM", "Još nije odlučeno", "Letjeti avionom", "Biti veoma srećan", "Biti daleko"},
        {"Keep your chin up", "Podrška", "MEDIUM", "Ostani pozitivan", "Gledaj gore", "Ne pričaj puno", "Sakrij emocije"},
        {"Make ends meet", "Novac", "MEDIUM", "Sastaviti kraj s krajem", "Završiti razgovor", "Spojiti dvije stvari", "Upoznati ljude"},
        {"Sit on the fence", "Odluke", "MEDIUM", "Ne zauzimati stranu", "Čekati napolju", "Biti tvrdoglav", "Praviti ogradu"},
        {"Back to square one", "Planovi", "MEDIUM", "Vratiti se na početak", "Igrati igru", "Naći brzo rješenje", "Izbjeći problem"},
        {"A hard nut to crack", "Problemi", "MEDIUM", "Težak problem ili osoba", "Ukusna hrana", "Lako rješenje", "Skupa kupovina"},
        {"Throw in the towel", "Takmičenje", "HARD", "Odustati", "Početi takmičenje", "Pomoći nekome", "Sakriti dokaz"},
        {"Barking up the wrong tree", "Procjena", "HARD", "Kriviti pogrešnu stvar ili osobu", "Gubiti vrijeme u prirodi", "Biti previše glasan", "Tražiti savjet"},
        {"Burn the midnight oil", "Posao", "HARD", "Raditi do kasno u noć", "Trošiti novac", "Spavati duboko", "Kuvati večeru"},
        {"Caught between two stools", "Odluke", "HARD", "Propasti birajući između dvije opcije", "Sjedjeti neudobno", "Biti uhvaćen u laži", "Izbjeći odluku"},
        {"A storm in a teacup", "Konflikt", "HARD", "Velika drama oko male stvari", "Opasna situacija", "Loša prognoza", "Skrivene emocije"},
        {"Pay through the nose", "Novac", "HARD", "Platiti previše", "Platiti unaprijed", "Dugovati novac", "Pregovarati uspješno"},
        {"Move the goalposts", "Pravila", "HARD", "Promijeniti pravila tokom igre", "Postići cilj", "Odložiti utakmicu", "Pomjeriti namještaj"},
        {"Have a chip on your shoulder", "Emocije", "HARD", "Biti lako uvredljiv", "Nositi teret", "Biti veoma ponosan", "Čuvati tajnu"},
        {"Open a can of worms", "Problemi", "HARD", "Pokrenuti komplikovan problem", "Naći jednostavno rješenje", "Otvoriti poklon", "Započeti šalu"},
        {"Steal someone's thunder", "Odnosi", "HARD", "Preuzeti tuđu pažnju ili zasluge", "Uplašiti nekoga", "Ukrasti nešto vrijedno", "Govoriti glasno"},
        {"By the skin of your teeth", "Rizik", "HARD", "Jedva uspjeti", "Biti veoma brz", "Lijepo izgledati", "Izbjeći odgovornost"},
        {"Cut the mustard", "Procjena", "HARD", "Biti dovoljno dobar", "Spremiti hranu", "Prekinuti razgovor", "Pokazati ljutnju"},
        {"Get down to brass tacks", "Posao", "HARD", "Preći na suštinu", "Spustiti stvari", "Kupiti alat", "Usporiti pregovore"},
        {"Have your work cut out", "Posao", "HARD", "Imati veoma težak posao pred sobom", "Dobiti lak zadatak", "Izgubiti posao", "Raditi bez plana"},
        {"In the nick of time", "Vrijeme", "HARD", "U posljednjem trenutku", "Previše rano", "Bez dogovora", "Na pogrešnom mjestu"},
        {"Know the ropes", "Iskustvo", "HARD", "Poznavati kako nešto funkcioniše", "Učiti vezivanje", "Biti zarobljen", "Raditi tajno"},
        {"Let sleeping dogs lie", "Konflikt", "HARD", "Ne dirati stari problem", "Pustiti nekoga da spava", "Priznati krivicu", "Pokrenuti raspravu"},
        {"Put the cart before the horse", "Planovi", "HARD", "Raditi stvari pogrešnim redom", "Putovati sporo", "Kupiti pogrešnu stvar", "Pobijediti u trci"},
        {"Toe the line", "Pravila", "HARD", "Poštovati pravila", "Stati u red", "Prekoračiti granicu", "Krenuti prvi"},
        {"Weather the storm", "Problemi", "HARD", "Izdržati tešku situaciju", "Gledati prognozu", "Putovati po kiši", "Naći mirno mjesto"},
        {"At the drop of a hat", "Vrijeme", "EASY", "Odmah i bez oklijevanja", "Kada padne kapa", "Samo zimi", "Poslije dugog plana"},
        {"A dime a dozen", "Vrijednost", "EASY", "Vrlo često i uobičajeno", "Veoma skupo", "Potpuno nestalo", "Veoma opasno"},
        {"Easy does it", "Savjeti", "EASY", "Polako i pažljivo", "To je lako", "Ubrzaj", "Prestani odmah"},
        {"Good to go", "Planovi", "EASY", "Spreman za polazak", "Dobar u odlasku", "Loše pripremljen", "Kasno je"},
        {"In a nutshell", "Razgovor", "EASY", "Ukratko", "U orahu", "Veoma komplikovano", "Bez objašnjenja"},
        {"On the same page", "Saradnja", "EASY", "Imati isto razumijevanje", "Čitati istu knjigu", "Biti u istoj sobi", "Pisati zajedno"},
        {"See eye to eye", "Odnosi", "EASY", "Slagati se", "Gledati se", "Svađati se", "Izbjegavati pogled"},
        {"Wrap up", "Posao", "EASY", "Završiti", "Umotati poklon", "Zagrijati se", "Sakriti nešto"},
        {"In hot water", "Problemi", "MEDIUM", "U nevolji", "U toploj vodi", "Na odmoru", "Bez brige"},
        {"Keep a low profile", "Odnosi", "MEDIUM", "Ne privlačiti pažnju", "Smanjiti sliku", "Govoriti glasno", "Stajati nisko"},
        {"Learn the hard way", "Učenje", "MEDIUM", "Naučiti kroz teško iskustvo", "Učiti napamet", "Izbjeći greške", "Dobiti lak zadatak"},
        {"Not my cup of tea", "Ukus", "MEDIUM", "Nije po mom ukusu", "Ne pijem čaj", "Nemam vremena", "Previše je vruće"},
        {"Play it by ear", "Planovi", "MEDIUM", "Odlučivati usput", "Svirati bez nota", "Slušati pažljivo", "Ignorisati pravila"},
        {"Read between the lines", "Razumijevanje", "MEDIUM", "Shvatiti skriveno značenje", "Čitati brže", "Preskočiti tekst", "Napisati poruku"},
        {"The last straw", "Emocije", "MEDIUM", "Kap koja je prelila čašu", "Posljednja slamka", "Mali problem", "Neočekivana pomoć"},
        {"Against the clock", "Vrijeme", "HARD", "Pod pritiskom vremena", "Protiv sata", "Bez cilja", "Veoma polako"},
        {"Bend over backwards", "Trud", "HARD", "Veoma se potruditi da pomogneš", "Savijati se unazad", "Izbjeći pomoć", "Raditi opasno"},
        {"Draw the line", "Pravila", "HARD", "Postaviti granicu", "Nacrtati liniju", "Povuci se", "Promijeniti mišljenje"},
        {"Face the music", "Odgovornost", "HARD", "Suočiti se sa posljedicama", "Slušati muziku", "Ići na koncert", "Izbjeći kaznu"},
        {"Go out on a limb", "Rizik", "HARD", "Preuzeti rizik", "Izaći na granu", "Biti sam", "Krenuti u šetnju"},
        {"Jump on the bandwagon", "Trendovi", "HARD", "Pridružiti se popularnom trendu", "Skočiti na vozilo", "Napustiti grupu", "Početi prvi"},
        {"Keep your cards close to your chest", "Strategija", "HARD", "Ne otkrivati planove", "Držati karte kod sebe", "Igrati pošteno", "Pokazati sve"},
        {"Put someone on the spot", "Pritisak", "HARD", "Dovesti nekoga u nezgodan položaj", "Staviti tačku", "Pomoći nekome", "Pozvati na igru"},
        {"Rock the boat", "Konflikt", "HARD", "Izazvati probleme u mirnoj situaciji", "Ljuljati brod", "Putovati morem", "Smiriti raspravu"},
        {"Under your belt", "Iskustvo", "HARD", "Već postignuto ili stečeno", "Ispod pojasa", "Skriveno od drugih", "Još nedovršeno"},
        {"Call the shots", "Odluke", "MEDIUM", "Donositi glavne odluke", "Pozvati pucnjeve", "Tražiti pomoć", "Promašiti cilj"},
        {"Get the hang of it", "Učenje", "EASY", "Naviknuti se i shvatiti kako ide", "Objesiti nešto", "Odustati od zadatka", "Krenuti brzo"},
        {"Hold your horses", "Savjeti", "EASY", "Sačekaj malo", "Drži konje", "Pobjegni odmah", "Nastavi bez plana"},
        {"It slipped my mind", "Svakodnevno", "EASY", "Zaboravio sam", "Palo mi je na pamet", "Predomislio sam se", "Loše sam čuo"},
        {"Long story short", "Razgovor", "EASY", "Ukratko rečeno", "Duga priča", "Ispričaj sve detaljno", "Bez zaključka"},
        {"No hard feelings", "Odnosi", "EASY", "Nema ljutnje", "Bez jakih emocija", "Nema dogovora", "Teško je prihvatiti"},
        {"On the house", "Novac", "MEDIUM", "Besplatno od lokala", "Na krovu kuće", "Kod kuće", "Preskupo"},
        {"A tough call", "Odluke", "MEDIUM", "Teška odluka", "Glasan poziv", "Laka pobjeda", "Kratak razgovor"},
        {"Break the ice", "Druženje", "MEDIUM", "Opustiti atmosferu", "Slomiti led", "Prekinuti sastanak", "Napraviti problem"},
        {"Cross that bridge when we come to it", "Planovi", "MEDIUM", "Riješiti problem kad dođe na red", "Preći most odmah", "Izbjeći putovanje", "Završiti posao prije vremena"},
        {"Go back to the drawing board", "Posao", "HARD", "Početi plan ponovo", "Vratiti se crtanju", "Prekinuti projekat", "Naći lakši put"},
        {"Hit the ground running", "Posao", "HARD", "Početi brzo i efikasno", "Pasti na zemlju", "Trčati bez cilja", "Odložiti početak"},
        {"Leave no stone unturned", "Trud", "HARD", "Pretražiti sve mogućnosti", "Ne dirati kamenje", "Odustati rano", "Sakriti tragove"},
        {"Read the room", "Odnosi", "HARD", "Procijeniti atmosferu i ljude", "Čitati u sobi", "Očistiti prostor", "Ignorisati druge"},
        {"The writing is on the wall", "Procjena", "HARD", "Ishod je već jasan", "Natpis je na zidu", "Poruka je izgubljena", "Plan je tajan"},
        {"Throw someone under the bus", "Odnosi", "HARD", "Žrtvovati nekoga radi sebe", "Gurnuti nekoga u vozilo", "Pomoći prijatelju", "Preuzeti krivicu"}
    };
  }
}
