package com.planning.reveil

import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import com.google.android.material.button.MaterialButton

class AlarmActivity : AppCompatActivity() {
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
      dispatchServiceAction(AlarmRingService.ACTION_SNOOZE)
      finish()
    }
  }

  override fun onBackPressed() {
    // Ignore back to force user action
  }

  private fun stopAndFinish() {
    dispatchServiceAction(AlarmRingService.ACTION_STOP)
    finish()
  }

  private fun dispatchServiceAction(action: String) {
    val serviceIntent = Intent(this, AlarmRingService::class.java).apply {
      this.action = action
      putExtra(AlarmRingService.EXTRA_ALARM_ID, intent.getStringExtra("alarm_id"))
      putExtra(AlarmRingService.EXTRA_LABEL, intent.getStringExtra("label"))
      putExtra(AlarmRingService.EXTRA_SERVICE_DATE, intent.getStringExtra("service_date"))
      putExtra(AlarmRingService.EXTRA_SERVICE_START, intent.getStringExtra("service_start"))
    }
    startService(serviceIntent)
  }
}
