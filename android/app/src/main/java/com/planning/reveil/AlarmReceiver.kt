package com.planning.reveil

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class AlarmReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val alarmIntent = Intent(context, AlarmActivity::class.java).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      putExtra("alarm_id", intent.getStringExtra("alarm_id"))
      putExtra("label", intent.getStringExtra("label"))
      putExtra("service_date", intent.getStringExtra("service_date"))
      putExtra("service_start", intent.getStringExtra("service_start"))
    }
    context.startActivity(alarmIntent)
  }
}
