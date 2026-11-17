package com.mkboard.keyboard;

import android.app.Activity;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.content.res.ColorStateList;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** Small helper for building grouped, iOS-Settings-like screens in code. */
final class Ui {
    final Activity a;
    final float dp;
    final boolean night;
    final int bg, card, text, sub, div, accent;

    Ui(Activity a) {
        this.a = a;
        dp = a.getResources().getDisplayMetrics().density;
        night = (a.getResources().getConfiguration().uiMode & Configuration.UI_MODE_NIGHT_MASK)
                == Configuration.UI_MODE_NIGHT_YES;
        bg = night ? Color.BLACK : 0xFFF2F2F7;
        card = night ? 0xFF1C1C1E : Color.WHITE;
        text = night ? Color.WHITE : Color.BLACK;
        sub = night ? 0xFF8E8E93 : 0xFF6D6D72;
        div = night ? 0xFF38383A : 0xFFC6C6C8;
        accent = night ? 0xFF0A84FF : 0xFF007AFF;
        a.getWindow().setStatusBarColor(bg);
        a.getWindow().setNavigationBarColor(bg);
        if (!night) {
            a.getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
    }

    /** Scrolling page; on tablets / unfolded foldables the column is centred at a readable width. */
    ScrollView scroll(LinearLayout col) {
        ScrollView sv = new ScrollView(a);
        sv.setBackgroundColor(bg);
        sv.setFillViewport(true);
        FrameLayout f = new FrameLayout(a);
        sv.addView(f);
        int sw = a.getResources().getConfiguration().screenWidthDp;
        int w = sw > 760 ? px(720) : ViewGroup.LayoutParams.MATCH_PARENT;
        f.addView(col, new FrameLayout.LayoutParams(w, ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.CENTER_HORIZONTAL));
        return sv;
    }

    int px(float v) {
        return (int) (v * dp + 0.5f);
    }

    GradientDrawable rounded(int color, float r) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(r * dp);
        return g;
    }

    TextView tv(String s, float sp, int color, boolean boldText) {
        TextView t = new TextView(a);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setTextDirection(View.TEXT_DIRECTION_LTR);
        t.setTextAlignment(View.TEXT_ALIGNMENT_VIEW_START);
        if (boldText) t.setTypeface(Typeface.create("sans-serif-medium", Typeface.BOLD));
        return t;
    }

    TextView title(String s) {
        TextView t = tv(s, 32, text, true);
        t.setPadding(px(4), px(18), px(4), px(4));
        return t;
    }

    /** Adds a section header + card to parent; returns the card. */
    LinearLayout section(LinearLayout parent, String header, String footer) {
        if (header != null) {
            TextView h = tv(header.toUpperCase(), 13, sub, false);
            h.setPadding(px(16), px(22), px(16), px(7));
            parent.addView(h);
        } else {
            View s = new View(a);
            parent.addView(s, new LinearLayout.LayoutParams(1, px(18)));
        }
        LinearLayout c = new LinearLayout(a);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setBackground(rounded(card, 12));
        c.setClipToOutline(true);
        parent.addView(c, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT));
        if (footer != null) {
            TextView f = tv(footer, 13, sub, false);
            f.setPadding(px(16), px(7), px(16), 0);
            parent.addView(f);
        }
        return c;
    }

    /** A tappable row with a label and an optional trailing view. */
    LinearLayout row(LinearLayout card, String label, String detail, View trailing, View.OnClickListener click) {
        if (card.getChildCount() > 0) {
            View d = new View(a);
            d.setBackgroundColor(div);
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT,
                    Math.max(1, px(0.5f)));
            lp.leftMargin = px(16);
            card.addView(d, lp);
        }
        LinearLayout r = new LinearLayout(a);
        r.setOrientation(LinearLayout.HORIZONTAL);
        r.setGravity(Gravity.CENTER_VERTICAL);
        r.setMinimumHeight(px(48));
        r.setPadding(px(16), px(8), px(14), px(8));
        LinearLayout texts = new LinearLayout(a);
        texts.setOrientation(LinearLayout.VERTICAL);
        texts.addView(tv(label, 17, text, false));
        if (detail != null) texts.addView(tv(detail, 13, sub, false));
        r.addView(texts, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        if (trailing != null) r.addView(trailing);
        if (click != null) {
            r.setBackground(new RippleDrawable(ColorStateList.valueOf(div), null, rounded(Color.WHITE, 0)));
            r.setOnClickListener(click);
        }
        card.addView(r);
        return r;
    }

    TextView button(String label, int color, View.OnClickListener l) {
        TextView b = tv(label, 17, Color.WHITE, true);
        b.setGravity(Gravity.CENTER);
        b.setPadding(px(16), px(14), px(16), px(14));
        b.setBackground(new RippleDrawable(ColorStateList.valueOf(0x40FFFFFF), rounded(color, 12), null));
        b.setOnClickListener(l);
        return b;
    }
}
