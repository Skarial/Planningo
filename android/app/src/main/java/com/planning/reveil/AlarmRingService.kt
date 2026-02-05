package com.planning.reveil

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.IBinder
import android.os.VibrationEffect
import android.os.Vibrator
import androidx.core.app.NotificationCompat

class AlarmRingService : Service() {
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    when (intent?.action) {
      ACTION_STOP -> {
        stopAlarm()
        stopSelf()
        return START_NOT_STICKY
      }
      ACTION_SNOOZE -> {
        AlarmScheduler.scheduleSnooze(
          context = this,
          alarmId = intent.getStringExtra(EXTRA_ALARM_ID) ?: "alarm",
          label = intent.getStringExtra(EXTRA_LABEL),
          serviceDate = intent.getStringExtra(EXTRA_SERVICE_DATE),
          serviceStart = intent.getStringExtra(EXTRA_SERVICE_START),
        )
        stopAlarm()
        stopSelf()
        return START_NOT_STICKY
      }
    }

    val alarmId = intent?.getStringExtra(EXTRA_ALARM_ID) ?: "alarm"
    val label = intent?.getStringExtra(EXTRA_LABEL) ?: getString(R.string.alarm_title)
    val serviceDate = intent?.getStringExtra(EXTRA_SERVICE_DATE)
    val serviceStart = intent?.getStringExtra(EXTRA_SERVICE_START)

    startForeground(NOTIFICATION_ID, buildNotification(alarmId, label, serviceDate, serviceStart))
    startAlarm()
    openAlarmScreen(alarmId, label, serviceDate, serviceStart)
    return START_STICKY
  }

  override fun onDestroy() {
    stopAlarm()
    super.onDestroy()
  }

  private fun startAlarm() {
    if (player == null) startSound()
    if (vibrator == null) startVibration()
  }

  private fun stopAlarm() {
    stopSound()
    stopVibration()
  }

  private fun startSound() {
    val uri = AlarmRingtoneStore.resolveUri(this) ?: return

    val audioAttrs = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
      .build()

    try {
      player = MediaPlayer().apply {
        setAudioAttributes(audioAttrs)
        setDataSource(this@AlarmRingService, uri)
        isLooping = true
        prepare()
        start()
      }
    } catch (_: Exception) {
      player = null
    }
  }

  private fun stopSound() {
    try {
      player?.stop()
    } catch (_: Exception) {
      // ignore
    }
    player?.release()
    player = null
  }

  private fun startVibration() {
    val vib = getSystemService(VIBRATOR_SERVICE) as Vibrator
    vibrator = vib
    val pattern = longArrayOf(0, 800, 500)
    if (Build.VERSION.SDK_INT >= 26) {
      vib.vibrate(VibrationEffect.createWaveform(pattern, 0))
    } else {
      @Suppress("DEPRECATION")
      vib.vibrate(pattern, 0)
    }
  }

  private fun stopVibration() {
    vibrator?.cancel()
    vibrator = null
  }

  private fun buildNotification(
    alarmId: String,
    label: String,
    serviceDate: String?,
    serviceStart: String?,
  ): Notification {
    ensureChannel()

    val contentText = listOfNotNull(serviceDate, serviceStart).joinToString(" ").ifBlank { label }
    val activityIntent = buildAlarmActivityIntent(alarmId, label, serviceDate, serviceStart)

    val openPendingIntent = PendingIntent.getActivity(
      this,
      alarmId.hashCode(),
      activityIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val stopIntent = Intent(this, AlarmRingService::class.java).apply {
      action = ACTION_STOP
      putExtra(EXTRA_ALARM_ID, alarmId)
    }
    val stopPendingIntent = PendingIntent.getService(
      this,
      "${alarmId}_stop".hashCode(),
      stopIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    val snoozeIntent = Intent(this, AlarmRingService::class.java).apply {
      action = ACTION_SNOOZE
      putExtra(EXTRA_ALARM_ID, alarmId)
      putExtra(EXTRA_LABEL, label)
      putExtra(EXTRA_SERVICE_DATE, serviceDate)
      putExtra(EXTRA_SERVICE_START, serviceStart)
    }
    val snoozePendingIntent = PendingIntent.getService(
      this,
      "${alarmId}_snooze".hashCode(),
      snoozeIntent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )

    return NotificationCompat.Builder(this, CHANNEL_ID)
      .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
      .setContentTitle(getString(R.string.alarm_title))
      .setContentText(contentText)
      .setOngoing(true)
      .setOnlyAlertOnce(true)
      .setPriority(NotificationCompat.PRIORITY_MAX)
      .setCategory(NotificationCompat.CATEGORY_ALARM)
      .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
      .setFullScreenIntent(openPendingIntent, true)
      .setContentIntent(openPendingIntent)
      .addAction(0, getString(R.string.alarm_stop), stopPendingIntent)
      .addAction(0, getString(R.string.alarm_snooze), snoozePendingIntent)
      .build()
  }

  private fun openAlarmScreen(
    alarmId: String,
    label: String,
    serviceDate: String?,
    serviceStart: String?,
  ) {
    val activityIntent = buildAlarmActivityIntent(alarmId, label, serviceDate, serviceStart)
    try {
      startActivity(activityIntent)
    } catch (_: Exception) {
      // ignore: notification still offers stop/snooze
    }
  }

  private fun buildAlarmActivityIntent(
    alarmId: String,
    label: String,
    serviceDate: String?,
    serviceStart: String?,
  ): Intent {
    return Intent(this, AlarmActivity::class.java).apply {
      putExtra(EXTRA_ALARM_ID, alarmId)
      putExtra(EXTRA_LABEL, label)
      putExtra(EXTRA_SERVICE_DATE, serviceDate)
      putExtra(EXTRA_SERVICE_START, serviceStart)
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
    }
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < 26) return
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as NotificationManager
    val existing = notificationManager.getNotificationChannel(CHANNEL_ID)
    if (existing != null) return

    val channel = NotificationChannel(
      CHANNEL_ID,
      "Reveil Planningo",
      NotificationManager.IMPORTANCE_HIGH,
    ).apply {
      description = "Alarmes reveil"
      enableVibration(true)
      setBypassDnd(false)
      setSound(null, null)
      lockscreenVisibility = Notification.VISIBILITY_PUBLIC
    }
    notificationManager.createNotificationChannel(channel)
  }

  companion object {
    const val ACTION_START = "com.planning.reveil.action.START_ALARM"
    const val ACTION_STOP = "com.planning.reveil.action.STOP_ALARM"
    const val ACTION_SNOOZE = "com.planning.reveil.action.SNOOZE_ALARM"

    const val EXTRA_ALARM_ID = "alarm_id"
    const val EXTRA_LABEL = "label"
    const val EXTRA_SERVICE_DATE = "service_date"
    const val EXTRA_SERVICE_START = "service_start"

    // New id to avoid legacy channel settings kept by Android.
    private const val CHANNEL_ID = "alarm_ring_channel_silent_v3"
    private const val NOTIFICATION_ID = 42001
  }
}
