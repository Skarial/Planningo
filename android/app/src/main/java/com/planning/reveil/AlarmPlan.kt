package com.planning.reveil

import org.json.JSONObject
import java.time.OffsetDateTime


data class AlarmPlan(
  val schemaVersion: Int,
  val generatedAt: String,
  val rules: AlarmRules,
  val alarms: List<AlarmEntry>,
)

data class AlarmRules(
  val startBefore: String?,
  val offsetMinutes: Int?,
  val horizonDays: Int?,
)

data class AlarmEntry(
  val id: String,
  val serviceDate: String?,
  val serviceCode: String?,
  val serviceStart: String?,
  val alarmAt: String,
  val label: String?,
  val requiresUserActionToStop: Boolean,
  val alarmAtEpochMillis: Long,
)

object AlarmPlanParser {
  fun parse(json: String): AlarmPlan {
    val root = JSONObject(json)
    val schemaVersion = root.optInt("schemaVersion", 1)
    val generatedAt = root.optString("generatedAt", "")

    val rulesObj = root.optJSONObject("rules")
    val rules = AlarmRules(
      startBefore = rulesObj?.optString("startBefore"),
      offsetMinutes = rulesObj?.let { if (it.has("offsetMinutes")) it.optInt("offsetMinutes") else null },
      horizonDays = rulesObj?.let { if (it.has("horizonDays")) it.optInt("horizonDays") else null },
    )

    val alarms = mutableListOf<AlarmEntry>()
    val arr = root.optJSONArray("alarms")

    if (arr != null) {
      for (i in 0 until arr.length()) {
        val obj = arr.optJSONObject(i) ?: continue
        val id = obj.optString("id", "").trim()
        val alarmAt = obj.optString("alarmAt", "").trim()
        if (id.isEmpty() || alarmAt.isEmpty()) continue

        val epochMillis = parseToEpochMillis(alarmAt) ?: continue

        val entry = AlarmEntry(
          id = id,
          serviceDate = obj.optString("serviceDate", null),
          serviceCode = obj.optString("serviceCode", null),
          serviceStart = obj.optString("serviceStart", null),
          alarmAt = alarmAt,
          label = obj.optString("label", null),
          requiresUserActionToStop = obj.optBoolean("requiresUserActionToStop", true),
          alarmAtEpochMillis = epochMillis,
        )
        alarms.add(entry)
      }
    }

    return AlarmPlan(
      schemaVersion = schemaVersion,
      generatedAt = generatedAt,
      rules = rules,
      alarms = alarms.sortedBy { it.alarmAtEpochMillis },
    )
  }

  private fun parseToEpochMillis(value: String): Long? {
    return try {
      OffsetDateTime.parse(value).toInstant().toEpochMilli()
    } catch (_: Exception) {
      null
    }
  }
}
