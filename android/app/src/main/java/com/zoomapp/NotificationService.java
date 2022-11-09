package com.zoomapp;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.IBinder;

import androidx.core.app.NotificationCompat;

import us.zoom.sdk.ZoomVideoSDK;

public class NotificationService extends Service {
  private final String CHANNEL_ID = "rn_zoom_video_sdk_notification_channel_id";
  private final int NOTIFICATION_ID = 9;

  @Override
  public void onCreate() {
    super.onCreate();
    NotificationCompat.Builder builder = new NotificationCompat.Builder(getApplicationContext(), CHANNEL_ID)
      .setAutoCancel(false)
      .setOngoing(true)
      .setContentText("RNZoomVideoSDK Screen Share");

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
      NotificationChannel channel = manager.getNotificationChannel(CHANNEL_ID);

      if (channel == null) {
        channel = new NotificationChannel(CHANNEL_ID, "RNZoomNotification", NotificationManager.IMPORTANCE_DEFAULT);
        if (channel.canShowBadge()) {
          channel.setShowBadge(false);
        }
      }
      if (manager != null) {
        manager.createNotificationChannel(channel);
      }
      startForeground(NOTIFICATION_ID, builder.build());
    }
  }

  @Override
  public int onStartCommand(Intent intent, int flags, int startId) {
    return super.onStartCommand(intent, flags, startId);
  }

  @Override
  public void onDestroy() {
    super.onDestroy();
    ZoomVideoSDK.getInstance().getShareHelper().stopShare();
    ZoomVideoSDK.getInstance().leaveSession(false);
  }

  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }

  public void onTaskRemoved(Intent rootIntent) {
    NotificationManager manager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
    manager.cancel(NOTIFICATION_ID);
    stopSelf();
    ZoomVideoSDK.getInstance().getShareHelper().stopShare();
    ZoomVideoSDK.getInstance().leaveSession(false);
  }

}
