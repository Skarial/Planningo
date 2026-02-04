package com.planning.reveil

import android.content.Context

object AlarmPlanStore {
  private const val PREFS = "alarm_plan_store"
  private const val KEY_JSON = "plan_json"

  fun save(context: Context, json: String) {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    prefs.edit().putString(KEY_JSON, json).apply()
  }

  fun load(context: Context): String? {
    val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    return prefs.getString(KEY_JSON, null)
  }
}
