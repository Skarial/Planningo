package com.planning.reveil

import android.app.AlarmManager
import android.Manifest
import android.app.Activity
import android.content.ClipboardManager
import android.content.pm.PackageManager
import android.content.Intent
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.provider.Settings
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton
import java.time.Instant
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

class MainActivity : AppCompatActivity() {
  private lateinit var statusView: TextView
  private lateinit var activeAlarmCountView: TextView
  private lateinit var ringtoneValueView: TextView
  private lateinit var permissionBtn: MaterialButton
  private lateinit var settingsBtn: MaterialButton
  private lateinit var ringtoneBtn: MaterialButton
  private val notificationPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission(),
  ) { granted ->
    if (!granted) {
      setStatus("Autorise les notifications pour afficher Arreter/Repeter sur l'alarme.")
    }
  }
  private val ringtonePickerLauncher = registerForActivityResult(
    ActivityResultContracts.StartActivityForResult(),
  ) { result ->
    if (result.resultCode != Activity.RESULT_OK) return@registerForActivityResult
    val uri = result.data?.getParcelableExtra<Uri>(RingtoneManager.EXTRA_RINGTONE_PICKED_URI) ?: return@registerForActivityResult
    AlarmRingtoneStore.save(this, uri)
    updateRingtoneSummary()
    setStatus("Sonnerie du reveil mise a jour.")
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)

    statusView = findViewById(R.id.status)
    activeAlarmCountView = findViewById(R.id.active_alarm_count)
    ringtoneValueView = findViewById(R.id.ringtone_value)
    permissionBtn = findViewById(R.id.btn_permission)
    settingsBtn = findViewById(R.id.btn_settings)
    ringtoneBtn = findViewById(R.id.btn_ringtone)

    permissionBtn.setOnClickListener { requestExactAlarmPermission() }
    settingsBtn.setOnClickListener { openAppSettings() }
    ringtoneBtn.setOnClickListener { openRingtonePicker() }

    ensureNotificationPermission()
    updatePermissionUi()
    updateRingtoneSummary()
    refreshActiveAlarmCount()
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
    updateRingtoneSummary()
    refreshActiveAlarmCount()
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
    if (
      uri.scheme.equals("planningoreveil", ignoreCase = true) &&
      uri.host.equals("import", ignoreCase = true)
    ) {
      if (importFromClipboard()) return

      val payload = uri.getQueryParameter("plan")
      if (!payload.isNullOrBlank()) {
        importFromText(payload)
      } else {
        setStatus("Import direct impossible : aucun plan trouve.")
      }
      return
    }

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
      refreshActiveAlarmCount(result.scheduled)
      setStatus(
        "Plan importé : ${result.scheduled} alarme(s) programmée(s), ${result.skippedPast} ignorée(s). Prochaine alarme : $nextLabel.",
      )
    } catch (err: Exception) {
      setStatus("Import invalide : ${err.message}")
    }
  }

  private fun importFromClipboard(): Boolean {
    val clipboard = getSystemService(CLIPBOARD_SERVICE) as? ClipboardManager ?: return false
    val clip = clipboard.primaryClip ?: return false
    if (clip.itemCount <= 0) return false
    val text = clip.getItemAt(0).coerceToText(this)?.toString()
    if (text.isNullOrBlank()) return false
    importFromText(text)
    return true
  }

  private fun setStatus(message: String) {
    statusView.text = message
  }

  private fun refreshActiveAlarmCount(overrideCount: Int? = null) {
    val count = overrideCount ?: AlarmScheduler.getActiveAlarmCount(this)
    activeAlarmCountView.text = getString(R.string.active_alarm_count_value, count)
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

  private fun ensureNotificationPermission() {
    if (Build.VERSION.SDK_INT < 33) return
    val granted = ContextCompat.checkSelfPermission(
      this,
      Manifest.permission.POST_NOTIFICATIONS,
    ) == PackageManager.PERMISSION_GRANTED
    if (!granted) {
      notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS)
    }
  }

  private fun openRingtonePicker() {
    val existingUri = AlarmRingtoneStore.resolveUri(this)
    val intent = Intent(RingtoneManager.ACTION_RINGTONE_PICKER).apply {
      putExtra(RingtoneManager.EXTRA_RINGTONE_TYPE, RingtoneManager.TYPE_ALARM)
      putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_DEFAULT, true)
      putExtra(RingtoneManager.EXTRA_RINGTONE_SHOW_SILENT, false)
      putExtra(RingtoneManager.EXTRA_RINGTONE_EXISTING_URI, existingUri)
      putExtra(RingtoneManager.EXTRA_RINGTONE_TITLE, getString(R.string.ringtone_picker_title))
    }
    ringtonePickerLauncher.launch(intent)
  }

  private fun updateRingtoneSummary() {
    val uri = AlarmRingtoneStore.resolveUri(this)
    val title = if (uri != null) {
      RingtoneManager.getRingtone(this, uri)?.getTitle(this)
    } else {
      null
    } ?: getString(R.string.ringtone_default_label)
    ringtoneValueView.text = getString(R.string.ringtone_current_value, title)
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
