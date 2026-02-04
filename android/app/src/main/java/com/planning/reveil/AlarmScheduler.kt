package com.planning.reveil

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import kotlin.math.abs

object AlarmScheduler {
  private const val PREFS = "alarm_prefs"
  private const val KEY_IDS = "alarm_ids"
  private const val ACTION_ALARM = "com.planning.reveil.ACTION_ALARM"

  data class ScheduleResult(
    val scheduled: Int,
    val skippedPast: Int,
  )

  fun scheduleAll(context: Context, alarms: List<AlarmEntry>): ScheduleResult {
    cancelAll(context)

    val now = System.currentTimeMillis()
    var scheduled = 0
    var skippedPast = 0
    val ids = mutableSetOf<String>()

    alarms.forEach { alarm ->
      if (alarm.alarmAtEpochMillis <= now) {
        skippedPast++
        return@forEach
      }
      scheduleAlarm(context, alarm)
      ids.add(alarm.id)
      scheduled++
    }

    saveIds(context, ids)
    return ScheduleResult(scheduled, skippedPast)
  }

  fun scheduleSnooze(
    context: Context,
    alarmId: String,
    label: String?,
    serviceDate: String?,
    serviceStart: String?,
    minutes: Int = 10,
  ) {
    val triggerAt = System.currentTimeMillis() + minutes * 60 * 1000L
    val alarm = AlarmEntry(
      id = "${alarmId}__snooze_$triggerAt",
      serviceDate = serviceDate,
      serviceCode = null,
      serviceStart = serviceStart,
      alarmAt = "",
      label = label,
      requiresUserActionToStop = true,
      alarmAtEpochMillis = triggerAt,
    )
    scheduleAlarm(context, alarm)
  }

  fun cancelAll(context: Context) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val existing = prefs.getStringSet(KEY_IDS, emptySet()) ?: emptySet()
    existing.forEach { cancelAlarm(context, it) }
    prefs.edit().remove(KEY_IDS).apply()
  }

  private fun scheduleAlarm(context: Context, alarm: AlarmEntry) {
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    val intent = Intent(context, AlarmReceiver::class.java).apply {
      action = ACTION_ALARM
      putExtra("alarm_id", alarm.id)
      putExtra("label", alarm.label)
      putExtra("service_date", alarm.serviceDate)
      putExtra("service_start", alarm.serviceStart)
    }

    val pendingIntent = PendingIntent.getBroadcast(
      context,
      requestCodeFor(alarm.id),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    alarmManager.setExactAndAllowWhileIdle(
      AlarmManager.RTC_WAKEUP,
      alarm.alarmAtEpochMillis,
      pendingIntent,
    )
  }

  private fun cancelAlarm(context: Context, alarmId: String) {
    val intent = Intent(context, AlarmReceiver::class.java).apply {
      action = ACTION_ALARM
      putExtra("alarm_id", alarmId)
    }
    val pendingIntent = PendingIntent.getBroadcast(
      context,
      requestCodeFor(alarmId),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager
    alarmManager.cancel(pendingIntent)
  }

  private fun requestCodeFor(id: String): Int {
    return abs(id.hashCode())
  }

  private fun saveIds(context: Context, ids: Set<String>) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit().putStringSet(KEY_IDS, ids).apply()
  }
}
