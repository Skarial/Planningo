package com.planning.reveil

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val alarmId = intent.getStringExtra("alarm_id")
    val label = intent.getStringExtra("label")
    val serviceDate = intent.getStringExtra("service_date")
    val serviceStart = intent.getStringExtra("service_start")

    val serviceIntent = Intent(context, AlarmRingService::class.java).apply {
      action = AlarmRingService.ACTION_START
      putExtra(AlarmRingService.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmRingService.EXTRA_LABEL, label)
      putExtra(AlarmRingService.EXTRA_SERVICE_DATE, serviceDate)
      putExtra(AlarmRingService.EXTRA_SERVICE_START, serviceStart)
    }
    ContextCompat.startForegroundService(context, serviceIntent)

    // Fallback: try to show the stop/snooze screen immediately on lock screen.
    val alarmActivityIntent = Intent(context, AlarmActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      putExtra(AlarmRingService.EXTRA_ALARM_ID, alarmId)
      putExtra(AlarmRingService.EXTRA_LABEL, label)
      putExtra(AlarmRingService.EXTRA_SERVICE_DATE, serviceDate)
      putExtra(AlarmRingService.EXTRA_SERVICE_START, serviceStart)
    }
    try {
      context.startActivity(alarmActivityIntent)
    } catch (_: Exception) {
      // Notification actions remain available as secondary stop path.
    }
  }
}
