package com.planning.reveil

import android.app.AlarmManager
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

class MainActivity : AppCompatActivity() {
  private lateinit var statusView: TextView
  private lateinit var permissionBtn: MaterialButton
  private lateinit var settingsBtn: MaterialButton
  private lateinit var testAlarmBtn: MaterialButton

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    statusView = findViewById(R.id.status)
    permissionBtn = findViewById(R.id.btn_permission)
    settingsBtn = findViewById(R.id.btn_settings)
    testAlarmBtn = findViewById(R.id.btn_test_alarm)

    permissionBtn.setOnClickListener { requestExactAlarmPermission() }
    settingsBtn.setOnClickListener { openAppSettings() }
    testAlarmBtn.setOnClickListener { scheduleTestAlarm() }

    updatePermissionUi()
    refreshStatusFromSystemAlarm()
    handleIntent(intent)
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleIntent(intent)
  }

  override fun onResume() {
    super.onResume()
    updatePermissionUi()
    refreshStatusFromSystemAlarm()
  }

  private fun handleIntent(intent: Intent) {
    when (intent.action) {
      Intent.ACTION_SEND -> handleSend(intent)
      Intent.ACTION_VIEW -> handleView(intent)
    }
  }

  private fun handleSend(intent: Intent) {
    val uri = intent.getParcelableExtra<Uri>(Intent.EXTRA_STREAM)
    if (uri != null) {
      importFromUri(uri)
      return
    }

    val text = intent.getStringExtra(Intent.EXTRA_TEXT)
    if (!text.isNullOrBlank()) {
      importFromText(text)
      return
    }
  }

  private fun handleView(intent: Intent) {
    val uri = intent.data ?: return
    importFromUri(uri)
  }

  private fun importFromUri(uri: Uri) {
    val text = contentResolver.openInputStream(uri)?.use { it.readBytes() }?.toString(Charsets.UTF_8)
    if (text.isNullOrBlank()) {
      setStatus("Import impossible : fichier vide ou illisible.")
      return
    }
    importFromText(text)
  }

  private fun importFromText(text: String) {
    try {
      val plan = AlarmPlanParser.parse(text)
      AlarmPlanStore.save(this, text)
      val result = AlarmScheduler.scheduleAll(this, plan.alarms)
      val nextAlarm = findNextAlarm(plan.alarms)
      val nextLabel = nextAlarm?.let { formatDateTime(it.alarmAtEpochMillis) } ?: "aucune"
      setStatus(
        "Plan importé : ${result.scheduled} alarme(s) programmée(s), ${result.skippedPast} ignorée(s). Prochaine alarme : $nextLabel.",
      )
    } catch (err: Exception) {
      setStatus("Import invalide : ${err.message}")
    }
  }

  private fun setStatus(message: String) {
    statusView.text = message
  }

  private fun updatePermissionUi() {
    if (Build.VERSION.SDK_INT < 31) {
      permissionBtn.isEnabled = false
      permissionBtn.text = "Autorisation non requise"
      return
    }

    val alarmManager = getSystemService(ALARM_SERVICE) as AlarmManager
    val allowed = alarmManager.canScheduleExactAlarms()
    permissionBtn.text = if (allowed) {
      "Alarme exacte : autorisée"
    } else {
      "Autoriser alarmes exactes"
    }
  }

  private fun scheduleTestAlarm() {
    val now = System.currentTimeMillis()
    val alarmInTwoMin = now + 2 * 60 * 1000L
    val alarm = AlarmEntry(
      id = "debug_alarm_$alarmInTwoMin",
      serviceDate = null,
      serviceCode = null,
      serviceStart = null,
      alarmAt = "",
      label = "Test alarme +2 min",
      requiresUserActionToStop = true,
      alarmAtEpochMillis = alarmInTwoMin,
    )
    AlarmScheduler.scheduleAll(this, listOf(alarm))
    setStatus("Test programmé : alarme dans 2 minutes.")
  }

  private fun refreshStatusFromSystemAlarm() {
    if (Build.VERSION.SDK_INT < 21) return
    val alarmManager = getSystemService(ALARM_SERVICE) as AlarmManager
    val next = alarmManager.nextAlarmClock ?: return
    val triggerAt = next.triggerTime
    if (triggerAt <= System.currentTimeMillis()) return
    setStatus("Alarme active : ${formatDateTime(triggerAt)}.")
  }

  private fun findNextAlarm(alarms: List<AlarmEntry>): AlarmEntry? {
    val now = System.currentTimeMillis()
    return alarms.firstOrNull { it.alarmAtEpochMillis > now }
  }

  private fun formatDateTime(epochMillis: Long): String {
    val formatter = DateTimeFormatter.ofPattern("dd/MM HH:mm", Locale.FRANCE)
    return Instant.ofEpochMilli(epochMillis)
      .atZone(ZoneId.systemDefault())
      .format(formatter)
  }

  private fun requestExactAlarmPermission() {
    if (Build.VERSION.SDK_INT < 31) return

    val alarmManager = getSystemService(ALARM_SERVICE) as AlarmManager
    if (alarmManager.canScheduleExactAlarms()) {
      updatePermissionUi()
      return
    }

    val intent = Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM)
    startActivity(intent)
  }

  private fun openAppSettings() {
    val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
    intent.data = Uri.fromParts("package", packageName, null)
    startActivity(intent)
  }
}
