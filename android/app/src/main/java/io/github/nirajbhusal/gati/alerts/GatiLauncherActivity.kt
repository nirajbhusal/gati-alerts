package io.github.nirajbhusal.gati.alerts

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.widget.TextView
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.google.androidbrowserhelper.trusted.LauncherActivity

/**
 * Opens the live site in Chrome as a Trusted Web Activity.
 * Full screen (no address bar) only after Digital Asset Links verify at the GitHub Pages origin.
 * Until then Chrome keeps the toolbar. That is the safe state, not a failure of the page.
 */
class GatiLauncherActivity : LauncherActivity() {
    override fun shouldLaunchImmediately(): Boolean = NoticeStore.isAcknowledged(this)

    override fun onCreate(savedInstanceState: Bundle?) {
        installSplashScreen()
        super.onCreate(savedInstanceState)
        if (isFinishing || NoticeStore.isAcknowledged(this)) return
        setContentView(R.layout.activity_notice)
        val root = findViewById<View>(R.id.root)
        ViewCompat.setOnApplyWindowInsetsListener(root) { view, insets ->
            val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            view.setPadding(bars.left, bars.top, bars.right, bars.bottom)
            insets
        }
        WindowCompat.getInsetsController(window, root).apply {
            isAppearanceLightStatusBars = true
            isAppearanceLightNavigationBars = true
        }
        val banner = findViewById<TextView>(R.id.preview_banner)
        val preview = getString(R.string.preview_banner)
        if (preview.isBlank()) {
            banner.visibility = View.GONE
        } else {
            banner.text = preview
            banner.visibility = View.VISIBLE
        }
        findViewById<View>(R.id.continue_button).setOnClickListener {
            NoticeStore.acknowledge(this)
            launchTwa()
        }
    }

    override fun getLaunchingUrl(): Uri {
        val data = intent?.data
        return if (GatiUrls.isInScope(data)) data!! else Uri.parse(GatiUrls.START)
    }

    override fun getUrlForIntent(intent: Intent): Uri? {
        val data = intent.data
        return if (GatiUrls.isInScope(data)) data else null
    }
}
