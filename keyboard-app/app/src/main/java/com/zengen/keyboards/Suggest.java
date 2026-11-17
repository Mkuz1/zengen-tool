package com.zengen.keyboards;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/** Lightweight word completion: built-in common words + words the user types. */
public final class Suggest {
    private static final Map<String, String[]> BUILTIN = new HashMap<>();
    private static final Map<String, String[]> STARTERS = new HashMap<>();

    static {
        BUILTIN.put("en", ("the and you that was for are with his they this have from one had word but not what all "
                + "were when your can said there use each which she how their will other about out many then them "
                + "these some her would make like him into time has look two more write see number way could people "
                + "than first water been call who its now find long down day did get come made may part over new "
                + "sound take only little work know place year live me back give most very after thing our just name "
                + "good sentence man think say great where help through much before line right too mean old any same "
                + "tell boy follow came want show also around form three small set put end does another well large "
                + "must big even such because turn here why ask went men read need land different home us move try "
                + "kind hand picture again change off play spell air away animal house point page letter mother "
                + "answer found study still learn should world high every near add food between own below country "
                + "plant last school father keep tree never start city earth eye light thought head under story saw "
                + "left don't few while along might close something seem next hard open example begin life always "
                + "those both paper together got group often run important until children side feet car mile night "
                + "walk white sea began grow took river four carry state once book hear stop without second later "
                + "miss idea enough eat face watch far really almost let above girl sometimes mountain cut young "
                + "talk soon list song being leave family it's hello thanks thank please meeting today tomorrow "
                + "yesterday morning evening office email call message sorry okay sure love beautiful happy birthday "
                + "congratulations awesome amazing tonight weekend friday monday available schedule regards dear "
                + "procurement supplier invoice purchase order delivery contract quotation approval budget payment "
                + "shipment warehouse inventory logistics vendor tender pricing discount").split(" "));
        BUILTIN.put("ar", ("في من على إلى أن هذا هذه التي الذي مع كان عن لا ما هو هي كل بعد قبل عند أو ثم لكن "
                + "نحن أنا أنت هم كيف متى أين لماذا نعم شكرا مرحبا السلام عليكم صباح الخير مساء الله إن شاء "
                + "اليوم غدا أمس الآن وقت يوم شهر سنة عمل بيت مدينة دولة كتاب طالب مدرسة جامعة شركة مكتب "
                + "اجتماع رسالة بريد هاتف سعر طلب توريد عقد فاتورة دفع مورد مشتريات حبيبي جميل ممتاز").split(" "));
        BUILTIN.put("es", ("de la que el en y a los se del las un por con no una su para es al lo como más pero sus "
                + "le ya o este sí porque esta entre cuando muy sin sobre también me hasta hay donde quien desde "
                + "todo nos durante todos uno les ni contra otros ese eso ante ellos esto mí antes algunos qué unos "
                + "yo otro otras otra él tanto esa estos mucho quienes nada muchos cual poco ella estar hola gracias "
                + "buenos días tardes noches mañana hoy ayer bien favor amigo trabajo casa tiempo").split(" "));
        BUILTIN.put("fr", ("le de un être et à il avoir ne je son que se qui ce dans en du elle au pour pas que vous "
                + "par sur faire plus dire me on mon lui nous comme mais pouvoir avec tout y aller voir en bien où "
                + "sans tu ou leur homme si deux mari moi vouloir te femme venir quand grand celui notre devoir là "
                + "jour prendre même votre rien petit encore aussi quelque dont tout mer trouver donner temps ça "
                + "bonjour merci bonsoir demain aujourd'hui hier travail maison").split(" "));
        BUILTIN.put("de", ("der die und in den von zu das mit sich des auf für ist im dem nicht ein eine als auch es "
                + "an werden aus er hat dass sie nach wird bei einer um am sind noch wie einem über einen so zum war "
                + "haben nur oder aber vor zur bis mehr durch man sein wurde sei hallo danke bitte guten morgen "
                + "abend heute gestern arbeit haus zeit jahr tag").split(" "));
        BUILTIN.put("it", ("di che è e la il un a per in una sono mi non ho lo ma ti si le con cosa da io bene se "
                + "come no qui tu del questo hai sei lei della tutto me ci gli sì te più al mio ciao grazie buongiorno "
                + "buonasera domani oggi ieri lavoro casa tempo anno giorno amico").split(" "));
        BUILTIN.put("pt", ("de a o que e do da em um para é com não uma os no se na por mais as dos como mas foi ao "
                + "ele das tem à seu sua ou ser quando muito há nos já está eu também só pelo pela até isso ela entre "
                + "olá obrigado obrigada bom dia tarde noite amanhã hoje ontem trabalho casa tempo").split(" "));
        BUILTIN.put("ru", ("и в не на я быть он с что а по это она этот к но они мы как из у который то за свой "
                + "что весь год от так о для ты же все тот мочь вы человек такой его сказать только или ещё бы себя "
                + "один как уже до время если сам когда другой вот говорить наш мой знать стать при чтобы дело "
                + "привет спасибо пожалуйста здравствуйте сегодня завтра вчера работа дом").split(" "));
        BUILTIN.put("tr", ("ve bir bu da de için ne ben sen o biz siz onlar çok daha gibi kadar ama ile var yok "
                + "evet hayır merhaba teşekkürler lütfen günaydın iyi akşamlar bugün yarın dün iş ev zaman").split(" "));

        STARTERS.put("en", new String[]{"I", "The", "I'm"});
        STARTERS.put("ar", new String[]{"في", "السلام", "شكرا"});
        STARTERS.put("es", new String[]{"Hola", "El", "La"});
        STARTERS.put("fr", new String[]{"Je", "Le", "Bonjour"});
        STARTERS.put("de", new String[]{"Ich", "Der", "Hallo"});
        STARTERS.put("it", new String[]{"Ciao", "Il", "La"});
        STARTERS.put("pt", new String[]{"Olá", "O", "A"});
        STARTERS.put("ru", new String[]{"Я", "Привет", "Это"});
        STARTERS.put("tr", new String[]{"Merhaba", "Bu", "Ben"});
    }

    private final SharedPreferences sp;
    private final Map<String, Map<String, Integer>> user = new HashMap<>();

    public Suggest(Context c, String kind) {
        sp = c.getSharedPreferences(kind + "_words", Context.MODE_PRIVATE);
    }

    public String[] starters(String lang) {
        String[] s = STARTERS.get(lang);
        return s == null ? new String[3] : s;
    }

    private Map<String, Integer> user(String lang) {
        Map<String, Integer> m = user.get(lang);
        if (m == null) {
            m = new HashMap<>();
            String raw = sp.getString(lang, "");
            if (!raw.isEmpty()) {
                for (String e : raw.split("\\|")) {
                    int i = e.lastIndexOf(':');
                    if (i > 0) {
                        try {
                            m.put(e.substring(0, i), Integer.parseInt(e.substring(i + 1)));
                        } catch (NumberFormatException ignored) {
                        }
                    }
                }
            }
            user.put(lang, m);
        }
        return m;
    }

    public void learn(String lang, String word, Locale loc) {
        if (word == null || word.length() < 2) return;
        String w = word.toLowerCase(loc);
        Map<String, Integer> m = user(lang);
        Integer c = m.get(w);
        m.put(w, c == null ? 1 : c + 1);
        if (m.size() > 800) {
            String min = null;
            int mv = Integer.MAX_VALUE;
            for (Map.Entry<String, Integer> e : m.entrySet())
                if (e.getValue() < mv) {
                    mv = e.getValue();
                    min = e.getKey();
                }
            m.remove(min);
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Integer> e : m.entrySet()) {
            if (sb.length() > 0) sb.append('|');
            sb.append(e.getKey()).append(':').append(e.getValue());
        }
        sp.edit().putString(lang, sb.toString()).apply();
    }

    public void clear() {
        user.clear();
        sp.edit().clear().apply();
    }

    public List<String> complete(String lang, String prefix, Locale loc, int max) {
        String p = prefix.toLowerCase(loc);
        List<String> out = new ArrayList<>();
        List<Map.Entry<String, Integer>> u = new ArrayList<>();
        for (Map.Entry<String, Integer> e : user(lang).entrySet())
            if (e.getKey().startsWith(p) && !e.getKey().equals(p)) u.add(e);
        u.sort((a, b) -> b.getValue() - a.getValue());
        for (Map.Entry<String, Integer> e : u) {
            if (out.size() >= max) break;
            out.add(e.getKey());
        }
        String[] b = BUILTIN.get(lang);
        if (b != null) {
            for (String w : b) {
                if (out.size() >= max) break;
                String lw = w.toLowerCase(loc);
                if (lw.startsWith(p) && !lw.equals(p) && !out.contains(lw)) out.add(lw);
            }
        }
        return out;
    }
}
