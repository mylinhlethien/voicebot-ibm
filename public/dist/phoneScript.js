window.onload = function () {
document.querySelector('.workspace').classList.add('active');
};
socket.emit('reload', true);

const gallery = document.querySelectorAll('.gallery-content__img'),
mobileBody = document.querySelector('.mobile-body'),
bg = document.querySelector('.bg-content');
var mic, recorder, soundFile, blob;
var state = 0;
var isRecording = false;
var isEndRecording = false;
var autoRec = true;


gallery.forEach(g => {
  g.addEventListener('click', function () {
    const imgSrc = this.dataset.img,
    activeGallery = document.querySelector('.gallery-content__img.active');

    activeGallery.classList.remove('active');
    this.classList.add('active');
    bg.style.backgroundImage = `url('${imgSrc}')`;
    mobileBody.style.backgroundImage = `url('${imgSrc}')`;
  });
});


$('.silent').click(function(event){
  console.log('click');
  if($(this).hasClass('active')){
    $(this).removeClass('active');
  }else {
    $(this).addClass('active');
  }
})

function testW(text){
  $.get(encodeURI('/sendToWatsonAssistant?text=' + text) , function(watsonAssistantResult){
    //console.log('Watson : ' + watsonAssistantResult);
    console.log(watsonAssistantResult);

  });
}


function callWatson(text){
  isEndRecording = false;
  $.get(encodeURI('/sendToWatsonAssistant?text=' + text) , function(watsonAssistantResult){
    //console.log('Watson : ' + watsonAssistantResult);
    //console.log(watsonAssistantResult);
    var autoAnswers = [];
    var advisorAnswers = [];
    watsonAssistantResult.advisor.forEach( (ele, key) => {
      if(ele === "auto"){
        autoAnswers.push(key);
      }else{
        advisorAnswers.push(key);
      }
    });
    //console.log(autoAnswers);
    var autoAnswer = "";
    autoAnswers.forEach( (ele) => {
      autoAnswer += watsonAssistantResult.customer[ele];
      watsonAssistantResult.customer.splice(ele, 1);
      watsonAssistantResult.advisor.splice(ele, 1);
    });
    console.log(autoAnswer);
    //console.log(watsonAssistantResult);
    if(autoAnswer !== ""){
      playWatsonAudio(autoAnswer);
    }

    if(advisorAnswers != []){
      console.log(watsonAssistantResult);
      socket.emit('options', watsonAssistantResult);
    }
  });
}

function playWatsonAudio(watsonAssistantResult){
  socket.emit('watson message', watsonAssistantResult);
  let audio = $('.audio').get(0);
  let downloadURL = encodeURI('/sendVoice?text=' + watsonAssistantResult);
  $('.audio').on('loadeddata', function () {
      $('.result').show();
  });
  audio.pause();
  try {
      audio.currentTime = 0;
  } catch (ex) {
      console.log(ex);
  }
  audio.src = downloadURL;
  audio.onloadedmetadata = function() {
      console.log(audio.duration)
      var duration = audio.duration;
      if(duration === Infinity){
        duration = 10;
      }
      setTimeout(function(){
        if(autoRec){
          startRecording();
        }
      }, duration * 1000);
  };
  audio.play();

}

function setup() {
  mic = new p5.AudioIn();
  recorder = new p5.SoundRecorder();
  recorder.setInput(mic);
  soundFile = new p5.SoundFile();
  touchStarted()

}
function touchStarted() {
	getAudioContext().resume();
}


function startRecording() {
  $('.camera').css('background-color', '#ff000073');
  isRecording = false;
  console.log('Recording start');
  mic.start();
  recorder.record(soundFile);
  var silence = 0;
  var micOff = 0;

  if(autoRec){
    var interval = setInterval(function() {
      if(micOff === 0){
        micOff = mic.getLevel()*1.8;
        //console.log('micOff = ' + micOff);
      }
      if(mic.getLevel() > micOff){
        //console.log('start');
        isRecording = true;
      }
       if (!isEndRecording) {
         if(isRecording){
           if(mic.getLevel() <= micOff){
             //console.log(silence);
             //console.log('Off ' + mic.getLevel());
             silence++
           }else {
             silence=0;
             micOff = mic.getLevel()/1.3;
             //console.log('On ' + mic.getLevel());
           }
           if(silence >= 50){
             clearInterval(interval);
             stopRecording();
           }
         }
       }else {
         clearInterval(interval);
         endRecording();
       }
    }, 50);
  }
}
function endRecording() {
  console.log('Recording end');
  isEndRecording = true;
  socket.emit('end conversation', "end");
  if(isRecording){
    isRecording = false;
    mic.stop();
    recorder.stop();
  }
}
function stopRecording() {
  $('.camera').css('background-color', '#1e1f2299');
  console.log('Recording stop');
  isRecording = false;
  mic.stop();
  recorder.stop();

  blob = soundFile.getBlob()
  let formdata = new FormData();
  formdata.append('soundBlob', blob,  'clientAudio.wav');
  $.ajax({
          url         : '/upload',
          data        : formdata ? formdata : form.serialize(),
          cache       : false,
          contentType : false,
          processData : false,
          type        : 'POST',
          success     : function(data, textStatus, jqXHR){
              console.log('uploaded');
              setTimeout(function(){
                $.get( "/transcriptClientAudio", function( googleData ) {
                    console.log('Google transcription : ' + googleData);
                    socket.emit('client message', googleData);
                    callWatson(googleData);
                });
              }, 1000);
          }
      });
}

socket.on('adviser answer', function(msg){
  playWatsonAudio(msg);
});

socket.on('start recording', function(msg){
  startRecording();
});

socket.on('stop recording', function(msg){
  stopRecording();
});

socket.on('auto recording', function(msg){
  autoRec = msg;
});
