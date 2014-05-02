(function() {
  var WPDocumentRevisions,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  WPDocumentRevisions = (function() {
    WPDocumentRevisions.prototype.hasUpload = false;

    WPDocumentRevisions.prototype.window = window.dialogArguments || opener || parent || top;

    function WPDocumentRevisions($) {
      this.updateTimestamps = __bind(this.updateTimestamps, this);
      this.postAutosaveCallback = __bind(this.postAutosaveCallback, this);
      this.overrideLock = __bind(this.overrideLock, this);
      this.restoreRevision = __bind(this.restoreRevision, this);
      this.editDocument = __bind(this.editDocument, this);
      this.enableSubmit = __bind(this.enableSubmit, this);
      this.autosaveEnableButtons = __bind(this.autosaveEnableButtons, this);
      this.hijackAutosave = __bind(this.hijackAutosave, this);
      var buttonError;
      this.$ = $;
      this.fNewDoc = false;
      this.EditDocumentButton = null;
      this.L_EditDocumentError_Text = "Editing not supported.";
      this.L_EditDocumentRuntimeError_Text = "Couldn't open document.";
      try {
        this.EditDocumentButton = new ActiveXObject('SharePoint.OpenDocuments.3');
        if (this.EditDocumentButton !== null) {
          this.fNewDoc = true;
        }
      } catch (_error) {
        buttonError = _error;
      }
      this.$('#edit-desktop-button').click(this.editDocument);
      this.$('.revision').click(this.restoreRevision);
      this.$('#override_link').click(this.overrideLock);
      this.$('#document a').click(this.requestPermission);
      this.$(document).bind('autosaveComplete', this.postAutosaveCallback);
      this.$(document).bind('documentUpload', this.legacyPostDocumentUpload);
      this.$(':button, :submit', '#submitpost').prop('disabled', true);
      this.$('#misc-publishing-actions a').click(this.enableSubmit);
      this.$('input, select').on('change', this.enableSubmit);
      this.$('input[type=text], textarea').on('keyup', this.enableSubmit);
      this.bindPostDocumentUploadCB();
      this.hijackAutosave();
      setInterval(this.updateTimestamps, 60000);
    }

    WPDocumentRevisions.prototype.hijackAutosave = function() {
      this.autosaveEnableButtonsOriginal = window.autosave_enable_buttons;
      return window.autosave_enable_buttons = this.autosaveEnableButtons;
    };

    WPDocumentRevisions.prototype.autosaveEnableButtons = function() {
      this.$(document).trigger('autosaveComplete');
      if (this.hasUpload) {
        return this.autosaveEnableButtonsOriginal();
      }
    };

    WPDocumentRevisions.prototype.enableSubmit = function() {
      return this.$(':button, :submit', '#submitpost').removeAttr('disabled');
    };

    WPDocumentRevisions.prototype.editDocument = function(e) {
      var error, ffPlugin, file;
      e.preventDefault();
      file = this.$(e.target).attr('href');
      if (this.fNewDoc) {
        if (!this.EditDocumentButton.EditDocument(file)) {
          return alert(this.L_EditDocumentRuntimeError);
        }
      } else {
        try {
          ffPlugin = document.getElementById("winFirefoxPlugin");
          return ffPlugin.EditDocument(file, null);
        } catch (_error) {
          error = _error;
          return alert(this.L_EditDocumentError_Text);
        }
      }
    };

    WPDocumentRevisions.prototype.restoreRevision = function(e) {
      e.preventDefault();
      if (confirm(wp_document_revisions.restoreConfirmation)) {
        return window.location.href = this.$(e.target).attr('href');
      }
    };

    WPDocumentRevisions.prototype.overrideLock = function() {
      return this.$.post(ajaxurl, {
        action: 'override_lock',
        post_id: this.$("#post_ID").val() || 0
      }, function(data) {
        if (data) {
          this.$('#lock_override').hide();
          this.$('.error').not('#lock-notice').hide();
          this.$('#publish, .add_media, #lock-notice').fadeIn();
          return autosave();
        } else {
          return alert(wp_document_revisions.lockError);
        }
      });
    };

    WPDocumentRevisions.prototype.requestPermission = function() {
      if (window.webkitNotifications != null) {
        return window.webkitNotifications.requestPermission();
      }
    };

    WPDocumentRevisions.prototype.lockOverrideNotice = function(notice) {
      if (window.webkitNotifications.checkPermission() > 0) {
        return window.webkitNotifications.RequestPermission(lock_override_notice);
      } else {
        return window.webkitNotifications.createNotification(wp_document_revisions.lostLockNoticeLogo, wp_document_revisions.lostLockNoticeTitle, notice).show();
      }
    };

    WPDocumentRevisions.prototype.postAutosaveCallback = function() {
      if (this.$('#autosave-alert').length > 0 && this.$('#lock-notice').length > 0 && this.$('#lock-notice').is(":visible")) {
        wp_document_revisions.lostLockNotice = wp_document_revisions.lostLockNotice.replace('%s', this.$('#title').val());
        if (window.webkitNotifications) {
          lock_override_notice(wp_document_revisions.lostLockNotice);
        } else {
          alert(wp_document_revisions.lostLockNotice);
        }
        return location.reload(true);
      }
    };

    WPDocumentRevisions.prototype.legacyPostDocumentUpload = function(attachmentID, extension) {
      return this.postDocumentUpload(attachmentID, extension);
    };

    WPDocumentRevisions.prototype.human_time_diff = function(from, to) {
      var d, days, diff, hours, mins;
      d = new Date();
      to = to || (d.getTime() / 1000) + parseInt(wp_document_revisions.offset);
      diff = Math.abs(to - from);
      if (diff <= 3600) {
        mins = Math.floor(diff / 60);
        mins = this.roundUp(mins);
        if (mins === 1) {
          return wp_document_revisions.minute.replace('%d', mins);
        } else {
          return wp_document_revisions.minutes.replace('%d', mins);
        }
      } else if ((diff <= 86400) && (diff > 3600)) {
        hours = Math.floor(diff / 3600);
        hours = this.roundUp(hours);
        if (hours === 1) {
          return wp_document_revisions.hour.replace('%d', hours);
        } else {
          return wp_document_revisions.hours.replace('%d', hours);
        }
      } else if (diff >= 86400) {
        days = Math.floor(diff / 86400);
        days = this.roundUp(days);
        if (days === 1) {
          return wp_document_revisions.day.replace('%d', days);
        } else {
          return wp_document_revisions.days.replace('%d', days);
        }
      }
    };

    WPDocumentRevisions.prototype.roundUp = function(n) {
      if (n < 1) {
        n = 1;
      }
      return n;
    };

    WPDocumentRevisions.prototype.bindPostDocumentUploadCB = function() {
      if (typeof uploader === "undefined" || uploader === null) {
        return;
      }
      return uploader.bind('FileUploaded', (function(_this) {
        return function(up, file, response) {
          if (response.response.match('media-upload-error')) {
            return;
          }
          return _this.postDocumentUpload(file.name, response.response);
        };
      })(this));
    };

    WPDocumentRevisions.prototype.updateTimestamps = function() {
      return this.$('.timestamp').each((function(_this) {
        return function() {
          return _this.$(_this).text(_this.human_time_diff(_this.$(_this).attr('id')));
        };
      })(this));
    };

    WPDocumentRevisions.prototype.postDocumentUpload = function(file, attachmentID) {
      if (typeof attachmentID === 'string' && attachmentID.indexOf('error') !== -1) {
        return this.$('.media-item:first').html(attachmentID);
      }
      if (file instanceof Object) {
        file = file.name.split('.').pop();
      }
      if (this.hasUpload) {
        return;
      }
      this.window.jQuery('#content').val(attachmentID);
      this.window.jQuery('#message').hide();
      this.window.jQuery('#revision-summary').show();
      this.window.jQuery(':button, :submit', '#submitpost').removeAttr('disabled');
      this.hasUpload = true;
      this.window.tb_remove();
      if (typeof convertEntities === 'function') {
        wp_document_revisions.postUploadNotice = convertEntities(wp_document_revisions.postUploadNotice);
      }
      this.window.jQuery('#post').before(wp_document_revisions.postUploadNotice).prev().fadeIn().fadeOut().fadeIn();
      if (this.window.jQuery('#sample-permalink').length !== 0) {
        return this.window.jQuery('#sample-permalink').html(this.window.jQuery('#sample-permalink').html().replace(/\<\/span>(\.[a-z0-9]{3,4})?@$/i, wp_document_revisions.extension));
      }
    };

    return WPDocumentRevisions;

  })();

  jQuery(document).ready(function($) {
    return window.WPDocumentRevisions = new WPDocumentRevisions($);
  });

}).call(this);
