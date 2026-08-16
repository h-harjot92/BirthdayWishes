/* =========================================
   GET HTML ELEMENTS
========================================= */

const startScreen =
    document.getElementById("startScreen");

const raceScreen =
    document.getElementById("raceScreen");

const birthdayScreen =
    document.getElementById("birthdayScreen");

const finalScreen =
    document.getElementById("finalScreen");

const startButton =
    document.getElementById("startButton");

const replayButton =
    document.getElementById("replayButton");

const speedElement =
    document.getElementById("speed");

const minutesElement =
    document.getElementById("minutes");

const secondsElement =
    document.getElementById("seconds");

const confetti =
    document.getElementById("confetti");


/* =========================================
   VARIABLES
========================================= */

let speedTimer;

let countdownTimer;

let birthdayTimer;

let started = false;


/* =========================================
   ENGINE SOUND
========================================= */

function playEngineSound() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        const audio =
            new AudioContext();

        const oscillator =
            audio.createOscillator();

        const gain =
            audio.createGain();


        oscillator.type = "sawtooth";


        oscillator.frequency.setValueAtTime(
            70,
            audio.currentTime
        );


        gain.gain.setValueAtTime(
            0.01,
            audio.currentTime
        );


        gain.gain.exponentialRampToValueAtTime(
            0.15,
            audio.currentTime + 0.2
        );


        oscillator.frequency.exponentialRampToValueAtTime(
            220,
            audio.currentTime + 2
        );


        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audio.currentTime + 3
        );


        oscillator.connect(gain);

        gain.connect(audio.destination);


        oscillator.start();

        oscillator.stop(
            audio.currentTime + 3
        );

    }

    catch (error) {

        console.log(
            "Audio is not supported."
        );

    }

}


/* =========================================
   VICTORY SOUND
========================================= */

function playVictorySound() {

    try {

        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        const audio =
            new AudioContext();


        /*
           First note
        */

        playNote(
            audio,
            523,
            0,
            0.25
        );


        /*
           Second note
        */

        playNote(
            audio,
            659,
            0.18,
            0.25
        );


        /*
           Third note
        */

        playNote(
            audio,
            784,
            0.36,
            0.35
        );


        /*
           Fourth high note
        */

        playNote(
            audio,
            1046,
            0.55,
            0.5
        );


    }

    catch (error) {

        console.log(
            "Victory sound unavailable."
        );

    }

}


/* =========================================
   PLAY ONE SOUND NOTE
========================================= */

function playNote(
    audio,
    frequency,
    delay,
    duration
) {

    const oscillator =
        audio.createOscillator();

    const gain =
        audio.createGain();


    oscillator.type =
        "triangle";


    oscillator.frequency.value =
        frequency;


    gain.gain.setValueAtTime(
        0.001,
        audio.currentTime + delay
    );


    gain.gain.exponentialRampToValueAtTime(
        0.25,
        audio.currentTime + delay + 0.03
    );


    gain.gain.exponentialRampToValueAtTime(
        0.001,
        audio.currentTime + delay + duration
    );


    oscillator.connect(gain);

    gain.connect(audio.destination);


    oscillator.start(
        audio.currentTime + delay
    );


    oscillator.stop(
        audio.currentTime +
        delay +
        duration
    );

}


/* =========================================
   CREATE CONFETTI
========================================= */

function createConfetti() {

    confetti.innerHTML = "";


    for (
        let i = 0;
        i < 80;
        i++
    ) {

        const piece =
            document.createElement("div");


        piece.className =
            "confetti-piece";


        piece.style.left =
            Math.random() * 100 + "%";


        piece.style.top =
            -Math.random() * 100 + "%";


        piece.style.animationDelay =
            Math.random() * 2 + "s";


        piece.style.animationDuration =
            3 + Math.random() * 3 + "s";


        confetti.appendChild(
            piece
        );

    }

}


/* =========================================
   RESET COUNTDOWN
========================================= */

function resetCountdown() {

    clearInterval(
        countdownTimer
    );


    minutesElement.textContent =
        "02";


    secondsElement.textContent =
        "00";

}


/* =========================================
   START TWO-MINUTE COUNTDOWN
========================================= */

function startCountdown() {

    let remainingSeconds =
        120;


    countdownTimer =
        setInterval(
            function () {

                remainingSeconds--;


                const minutes =
                    Math.floor(
                        remainingSeconds / 60
                    );


                const seconds =
                    remainingSeconds % 60;


                minutesElement.textContent =
                    String(minutes)
                        .padStart(2, "0");


                secondsElement.textContent =
                    String(seconds)
                        .padStart(2, "0");


                if (
                    remainingSeconds <= 0
                ) {

                    clearInterval(
                        countdownTimer
                    );

                }

            },

            1000
        );

}


/* =========================================
   SHOW BIRTHDAY SCREEN
========================================= */

function showBirthday() {

    raceScreen.classList.add(
        "hidden"
    );


    birthdayScreen.classList.remove(
        "hidden"
    );


    /*
       Celebration!
    */

    playVictorySound();


    /*
       Confetti
    */

    createConfetti();


    /*
       Start 2-minute timer
    */

    resetCountdown();

    startCountdown();


    /*
       Move to final screen
       after 2 minutes
    */

    birthdayTimer =
        setTimeout(
            function () {

                showFinalScreen();

            },
            120000
        );

}


/* =========================================
   SHOW FINAL SCREEN
========================================= */

function showFinalScreen() {

    clearInterval(
        countdownTimer
    );


    birthdayScreen.classList.add(
        "hidden"
    );


    finalScreen.classList.remove(
        "hidden"
    );

}


/* =========================================
   START EXPERIENCE
========================================= */

function startExperience() {

    if (started) {

        return;

    }


    started = true;


    /*
       Play engine sound
    */

    playEngineSound();


    /*
       Hide start screen
    */

    startScreen.classList.add(
        "hidden"
    );


    /*
       Show racing screen
    */

    raceScreen.classList.remove(
        "hidden"
    );


    /*
       Reset speed
    */

    let currentSpeed = 0;


    speedElement.textContent =
        "000";


    /*
       Animate speed
    */

    speedTimer =
        setInterval(
            function () {

                currentSpeed +=
                    Math.floor(
                        Math.random() * 20
                    ) + 15;


                if (
                    currentSpeed >= 287
                ) {

                    currentSpeed = 287;

                    clearInterval(
                        speedTimer
                    );

                }


                speedElement.textContent =
                    String(currentSpeed)
                        .padStart(3, "0");

            },

            120
        );


    /*
       Race lasts about 3.8 seconds
    */

    setTimeout(
        function () {

            clearInterval(
                speedTimer
            );


            showBirthday();

        },

        3800
    );

}


/* =========================================
   REPLAY
========================================= */

function replayExperience() {

    /*
       Stop all timers
    */

    clearInterval(
        speedTimer
    );

    clearInterval(
        countdownTimer
    );

    clearTimeout(
        birthdayTimer
    );


    /*
       Reset state
    */

    started = false;


    /*
       Reset screens
    */

    startScreen.classList.remove(
        "hidden"
    );


    raceScreen.classList.add(
        "hidden"
    );


    birthdayScreen.classList.add(
        "hidden"
    );


    finalScreen.classList.add(
        "hidden"
    );


    /*
       Reset speed
    */

    speedElement.textContent =
        "000";


    /*
       Reset countdown
    */

    resetCountdown();


    /*
       Remove old confetti
    */

    confetti.innerHTML = "";

}


/* =========================================
   BUTTON EVENTS
========================================= */

startButton.addEventListener(
    "click",
    startExperience
);


replayButton.addEventListener(
    "click",
    replayExperience
);