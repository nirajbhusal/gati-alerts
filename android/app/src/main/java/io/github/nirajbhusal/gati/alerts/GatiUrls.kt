package io.github.nirajbhusal.gati.alerts

import android.net.Uri

/** Only the live Gati Alerts site. Other origins stay in the browser, where the address is visible. */
object GatiUrls {
    const val START = "https://nirajbhusal.github.io/gati-alerts/?source=android"
    private const val HOST = "nirajbhusal.github.io"

    fun isInScope(uri: Uri?): Boolean {
        if (uri == null) return false
        if (!uri.scheme.equals("https", ignoreCase = true)) return false
        if (!uri.host.equals(HOST, ignoreCase = true)) return false
        val path = uri.path ?: return false
        return path == "/gati-alerts" || path.startsWith("/gati-alerts/")
    }
}
