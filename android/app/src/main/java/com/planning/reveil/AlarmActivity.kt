package com.planning.reveil

import android.media.AudioAttributes
import android.media.MediaPlayer
import android.media.RingtoneManager
import android.os.Build
import android.os.Bundle
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.WindowManager
import android.widget.TextView
import com.google.android.material.button.MaterialButton
import androidx.appcompat.app.AppCompatActivity

class AlarmActivity : AppCompatActivity() {
  private var player: MediaPlayer? = null
  private var vibrator: Vibrator? = null

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_alarm)

    if (Build.VERSION.SDK_INT >= 27) {
      setShowWhenLocked(true)
      setTurnScreenOn(true)
    } else {
      window.addFlags(
        WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
          WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
          WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON,
      )
    }

    val labelView = findViewById<TextView>(R.id.alarm_label)
    val serviceView = findViewById<TextView>(R.id.alarm_service)

    val label = intent.getStringExtra("label")
    val serviceDate = intent.getStringExtra("service_date")
    val serviceStart = intent.getStringExtra("service_start")

    labelView.text = label ?: ""
    if (!serviceDate.isNullOrBlank() || !serviceStart.isNullOrBlank()) {
      serviceView.text = "${getString(R.string.alarm_service)}: ${serviceDate ?: ""} ${serviceStart ?: ""}".trim()
    } else {
      serviceView.text = ""
    }

    val stopBtn = findViewById<MaterialButton>(R.id.btn_stop)
    val snoozeBtn = findViewById<MaterialButton>(R.id.btn_snooze)

    stopBtn.setOnClickListener { stopAndFinish() }
    snoozeBtn.setOnClickListener {
      AlarmScheduler.scheduleSnooze(
        this,
        alarmId = intent.getStringExtra("alarm_id") ?: "alarm",
        label = label,
        serviceDate = serviceDate,
        serviceStart = serviceStart,
      )
      stopAndFinish()
    }

    startSound()
    startVibration()
  }

  override fun onBackPressed() {
    // Ignore back to force user action
  }

  override fun onDestroy() {
    stopSound()
    stopVibration()
    super.onDestroy()
  }

  private fun startSound() {
    val uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM)
      ?: RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
      ?: return

    val audioAttrs = AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_ALARM)
      .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC)
      .build()

    try {
      player = MediaPlayer().apply {
        setAudioAttributes(audioAttrs)
        setDataSource(this@AlarmActivity, uri)
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
  }

  private fun stopAndFinish() {
    stopSound()
    stopVibration()
    finish()
  }
}
