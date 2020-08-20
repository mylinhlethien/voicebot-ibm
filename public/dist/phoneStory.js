function offBG() {
  $('#top-infos').hide();
  $('#middle-infos').hide();
  $('.mobile-body').css("background-image", "url('./img/offBG.png')");
}
function lockBG() {
  $('#top-infos').hide();
  $('.mobile-body').css("background-image", "url('./img/lockBG.png')");
  $('#middle-infos').show();
}
function unlockBG() {
  $('#top-infos').hide();
  $('.mobile-body').css("background-image", "url('./img/unlockBG.png')");
  $('#middle-infos').show();
}
function notificationBG() {
  $('#top-infos').hide();
  $('.mobile-body').css("background-image", "url('./img/notificationBG.png')");
  $('#middle-infos').show();
}
function callBG() {
  $('#middle-infos').hide();
  $('.mobile-body').css("background-image", "url('./img/callBG.png')");
  $('#top-infos').show();
  $('#top-infos .custom-hour').removeClass('black');
  $('#top-infos .custom-hour').addClass('white');
}
function numberBG() {
  $('#middle-infos').hide();
  $('.mobile-body').css("background-image", "url('./img/numberBG.png')");
  $('#top-infos').show();
  $('#top-infos .custom-hour').removeClass('white');
  $('#top-infos .custom-hour').addClass('black');
}
function callBG() {
  $('#middle-infos').hide();
  $('.mobile-body').css("background-image", "url('./img/callBG.png')");
  $('#top-infos').show();
  $('#top-infos .custom-hour').removeClass('black');
  $('#top-infos .custom-hour').addClass('white');
}

function updateTime(){
    var currentTime = new Date();
    var hours = currentTime.getHours();
    var minutes = currentTime.getMinutes();
    if (minutes < 10){
        minutes = "0" + minutes
    }
    var display_time = hours + ":" + minutes;
    $('.hour-label').text(display_time);

    const display_days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Friday"];
    const display_months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var display_date = display_days[currentTime.getDay()] + ' ' + currentTime.getDate() + ' ' + display_months[currentTime.getMonth()];
    $('.date-label').text(display_date);
}

updateTime();
setInterval(updateTime, 20000);
var storyTurnCounter;
story1();

function story1(){
  storyTurnCounter = 1;
  offBG();
  $('#gallery-label').text("Let's turn on the display ! Tap twice to activate.");
  $('.camera').css('background-color', '#1e1f2299');
  var touchtime = 0;
  $('.layer-2').on("click", function() {
      if (touchtime == 0) {
          touchtime = new Date().getTime();
      } else {
          if (((new Date().getTime()) - touchtime) < 500) {
            $(this).off();
            story2();
              touchtime = 0;
          } else {
              touchtime = new Date().getTime();
          }
      }
  });
}

function story2(){
  storyTurnCounter = 2;
  lockBG();
  $('#gallery-label').text("Swipe up to unlock the phone");
  $('.camera').css('background-color', '#ff000073');
  setTimeout(function(){
    $('.camera').css('background-color', '#1e1f2299');
    setTimeout(function(){
      $('.camera').css('background-color', '#ff000073');
      setTimeout(function(){
        $('.camera').css('background-color', '#1e1f2299');
        setTimeout(function(){
          $('.camera').css('background-color', '#ff000073');
          setTimeout(function(){
            unlockBG();
            $('.camera').css('background-color', '#1e1f2299');
            $('.layer-2').on('swipeup',function(event){
              $(this).off();
              story3();
            });
          }, 300);
        }, 300);
      }, 100);
    }, 200);
  }, 300);

}


function story3(){
  storyTurnCounter = 3;
  numberBG();
  $('#gallery-label').text("Tap the phone to call your bank assistant.");
  $('.camera').css('background-color', '#1e1f2299');
  setTimeout(function(){
    $('.layer-2').on('click', function(event){
      $(this).off();
      story4();
      callWatson('');
    });
  }, 1200);
}

function story4() {
  storyTurnCounter = 4;
  callBG();
  $('#gallery-label').text("You can swipe down to display the notification center.");
  setTimeout(function(){
    $('.layer-2').on('swipedown',function(event){
      $(this).off();
      story5();
    });
    $('.layer-2').on('click',function(event){
      $(this).off();
      story3();
      endRecording();
    });
  }, 1200);
}

function story5() {
  storyTurnCounter = 5;
  notificationBG();
  $('#gallery-label').text("This is your notification. You can swipe up to go back to your call.");
  setTimeout(function(){
    $('.layer-2').on('swipeup',function(event){
      $(this).off();
      story4();
    });
  }, 1200);
}


$('.power').on('click', function(event){
  $('.layer-2').off();
  if(storyTurnCounter === 1){
    story2();
  } else {
    story1();
  }
})
