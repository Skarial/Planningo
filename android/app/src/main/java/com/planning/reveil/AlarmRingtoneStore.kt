package com.planning.reveil

import android.content.Context
import android.media.RingtoneManager
import android.net.Uri

object AlarmRingtoneStore {
  private const val PREFS = "alarm_settings"
  private const val KEY_RINGTONE_URI = "ringtone_uri"

  fun save(context: Context, uri: Uri) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit().putString(KEY_RINGTONE_URI, uri.toString()).apply()
  }

  fun resolveUri(context: Context): Uri? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val raw = prefs.getString(KEY_RINGTONE_URI, null)
    if (!raw.isNullOrBlank()) {
      return Uri.parse(raw)
    }
    return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
  }
}
