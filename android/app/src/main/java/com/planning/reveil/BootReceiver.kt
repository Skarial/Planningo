package com.planning.reveil

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class BootReceiver : BroadcastReceiver() {
  override fun onReceive(context: Context, intent: Intent) {
    val action = intent.action ?: return
    if (
      action != Intent.ACTION_BOOT_COMPLETED &&
      action != Intent.ACTION_MY_PACKAGE_REPLACED
    ) {
      return
    }

    val pending = goAsync()
    try {
      val json = AlarmPlanStore.load(context) ?: return
      val plan = AlarmPlanParser.parse(json)
      AlarmScheduler.scheduleAll(context, plan.alarms)
    } catch (_: Exception) {
      // ignore
    } finally {
      pending.finish()
    }
  }
}
