package com.zengen.keyboards;

import java.util.ArrayList;
import java.util.List;

public final class KeyboardLayout {
    public static final class Row {
        public final List<Key> keys = new ArrayList<>();
        /** Relative row height (1 = normal key row). */
        public float h = 1f;
        public float top, bottom;

        public Row add(Key k) {
            keys.add(k);
            return this;
        }
    }

    public final List<Row> rows = new ArrayList<>();
    /** Number of key "units" across the keyboard. */
    public float columns = 10f;
    public boolean letters;
    public boolean emoji;

    public Row row() {
        Row r = new Row();
        rows.add(r);
        return r;
    }
}
