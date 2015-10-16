const electron = require('electron');
const $ = require('./vendor/jquery.min');
const Store = require('./store');
const Toast = require('./toast');

// Block zoom
electron.webFrame.setVisualZoomLevelLimits(1,1);
electron.webFrame.setLayoutZoomLevelLimits(0, 0);

// Open external links
$(document).on('click', 'a[href^="http"]', (e) => {
  e.preventDefault();
});

// Init store
const store = electron.remote.getGlobal('store');

// Init toasts
const toast = new Toast();

// Get user id from store
let token = store.get('token');

// If logged in, show logged in screen
if (token) {
  $('body').addClass('logged-in');
  $('#loggedIn').removeClass('hidden');
}

// If not logged in, show registration screen
if (!token) {
  $('#login').removeClass('hidden');
}

$('[name=autoUploadImages]').prop('checked', store.get('auto-upload-images'));
$('[name=autoLaunch]').prop('checked', store.get('auto-launch'));
$('[name=keepActiveInTrayOnClose]').prop('checked', store.get('keep-active-in-tray-on-close'));
$('[name=useShortenedLinks]').prop('checked', store.get('use-shortened-links'));

$('[name=autoUploadImages]').on('change', (e) => {
  store.set('auto-upload-images', $(e.target).is(':checked'));
});
$('[name=autoLaunch]').on('change', (e) => {
  store.set('auto-launch', $(e.target).is(':checked'));
});
$('[name=keepActiveInTrayOnClose]').on('change', (e) => {
  store.set('keep-active-in-tray-on-close', $(e.target).is(':checked'));
});
$('[name=useShortenedLinks]').on('change', (e) => {
  store.set('use-shortened-links', $(e.target).is(':checked'));
});

// On sign out click
$('[data-id=signOut]').on('click', (e) => {
  e.preventDefault();

  token = null;
  store.set('token', token);
  $('body').removeClass('logged-in');
  $('#login').removeClass('hidden');
  $('#loggedIn').addClass('hidden');

  $('[data-id=signInCancel]').addClass('hidden');
  $('[data-id=signInToken]').addClass('hidden');
  $('#login').addClass('initial');

  // toast.success('Signed out!');
});

$('[data-id=signIn]').on('click', (e) => {
  $('#login').removeClass('initial');

  if (!$('[data-id=signInToken]').hasClass('hidden')) {
    let token = $('[data-id=signInToken]').val();
    $.post('http://localhost/auth.verify', { token }).done(() => {
      // toast.success('Signed in!');
      store.set('token', token);
      $('body').addClass('logged-in');
      $('#login').addClass('hidden');
      $('#loggedIn').removeClass('hidden');
    }).fail(() => {
      toast.failure('Sign in failed!');
    });
    return;
  }

  electron.shell.openExternal(e.target.href);

  $('[data-id=signInCancel]').removeClass('hidden');
  $('[data-id=signInToken]').removeClass('hidden');
});

$('[data-id=signInCancel]').on('click', (e) => {
  $('[data-id=signInCancel]').addClass('hidden');
  $('[data-id=signInToken]').addClass('hidden');
  $('#login').addClass('initial');
});
