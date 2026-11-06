package io.github.nirajbhusal.gati.alerts

import android.content.Context

/** Remembers that this install has shown the independent-project notice. Not a legal acceptance log. */
object NoticeStore {
    private const val PREFS = "gati_notice"
    private const val KEY = "acknowledged_v1"

    fun isAcknowledged(context: Context): Boolean =
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getBoolean(KEY, false)

    fun acknowledge(context: Context) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            .edit()
            .putBoolean(KEY, true)
            .apply()
    }
}
