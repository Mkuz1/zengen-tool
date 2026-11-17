package com.mkboard.keyboard;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInstaller;
import android.widget.Toast;

/** Receives package-installer results for in-app updates. */
public class InstallReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent i) {
        int status = i.getIntExtra(PackageInstaller.EXTRA_STATUS, PackageInstaller.STATUS_FAILURE);
        if (status == PackageInstaller.STATUS_PENDING_USER_ACTION) {
            Intent confirm = i.getParcelableExtra(Intent.EXTRA_INTENT);
            if (confirm != null) {
                confirm.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                try {
                    c.startActivity(confirm);
                } catch (RuntimeException e) {
                    Toast.makeText(c, "Open MK Board to finish the update", Toast.LENGTH_LONG).show();
                }
            }
        } else if (status != PackageInstaller.STATUS_SUCCESS) {
            String msg = i.getStringExtra(PackageInstaller.EXTRA_STATUS_MESSAGE);
            if (status == PackageInstaller.STATUS_FAILURE_CONFLICT || status == PackageInstaller.STATUS_FAILURE_INCOMPATIBLE) {
                msg = "this release is signed differently from the installed app. Uninstall MK Board once, then "
                        + "install the new version from " + Updater.RELEASES_PAGE;
            }
            if (status != PackageInstaller.STATUS_FAILURE_ABORTED) {
                Toast.makeText(c, "Update failed: " + (msg == null ? "unknown error" : msg), Toast.LENGTH_LONG).show();
            }
        }
    }
}
