package com.planning.reveil

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import androidx.core.content.ContextCompat

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val serviceIntent = Intent(context, AlarmRingService::class.java).apply {
      action = AlarmRingService.ACTION_START
      putExtra(AlarmRingService.EXTRA_ALARM_ID, intent.getStringExtra("alarm_id"))
      putExtra(AlarmRingService.EXTRA_LABEL, intent.getStringExtra("label"))
      putExtra(AlarmRingService.EXTRA_SERVICE_DATE, intent.getStringExtra("service_date"))
      putExtra(AlarmRingService.EXTRA_SERVICE_START, intent.getStringExtra("service_start"))
    }
    ContextCompat.startForegroundService(context, serviceIntent)
  }
}
