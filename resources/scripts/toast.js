const $ = require('./vendor/jquery.min');

class Toast {
  constructor() {
    this.timer = null;
  }

  success(text) {
    this.toast(true, text);
  }

  failure(text) {
    this.toast(false, text);
  }

  toast(success, text) {
    if (this.timer) {
      clearTimeout(this.timer);
    }

    this.timer = setTimeout(this.hide, 3000);

    let $previousToast = $('body').find('[data-id=toast]');

    let html = '';
    html += '<div class="toast" data-id="toast">';
    html += '<div class="toast-container">';
    html += '<div class="toast-wrapper" data-id="content">';
    html += '<div class="toast-icon"></div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    let $toast = $(html);
    let $content = $toast.find('[data-id=content]');

    if (success) {
      $toast.addClass('success');
    } else {
      $toast.addClass('failure');
    }

    $content.append(text);

    if ($previousToast.length) {
      $toast.addClass('show');
      $previousToast.remove();
    }

    $('body').append($toast);
    setTimeout(() => {
      $toast.addClass('show');
    }, 1);
  }

  hide() {
    let $toast = $('body').find('[data-id=toast]');
    $toast.removeClass('show');

    setTimeout(() => {
      $toast.remove();
      this.timer = null;
    }, 350);
  }
}

// expose the class
module.exports = Toast;
