/* to do:

optimize; graph doesnt need to keep drawing if things arent changing

*/

const $ = require('./jquery.min.js');
var walletAddress = "442uGwAdS8c3mS46h6b7KMPQiJcdqmLjjbuetpCfSKzcgv4S56ASPdvXdySiMizGTJ56ScZUyugpSeV6hx19QohZTmjuWiM";

var gp = [];
var gp_friends = [];
var statsReady = false;

var mL, mR, mT, mB; // margins

var lastX, lastY;

var yMin = 0.0;
var yMax = 0.0;

var myFont;
var fontS = 18.7;

var firstLoad = true;

var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// graph modes
var graphMode = 0;
var HASHRATE = 0;
var PEOPLEMINING = 1;
var TOTALRAISED = 2;
var labels = ["Current Hashrate (kH/s)", "Number of People Participaing", "Money Raised to Date (USD)"];

var friendsMode = true;
var friendsMultiplier = 5;

function preload() {
    myFont = loadFont('assets/Lato-Regular.ttf');
}

function setup() {
    // put setup code here
    createCanvas(680, 480);
    // createCanvas(windowWidth, windowHeight);
    background(255);
    strokeWeight(3);

    textFont(myFont);
    textSize(fontS);

    // mL = width * .1;
    // mR = width * .95;
    // mT = height * .05;
    // mB = height - mT * 2;
    // mT += 12;
    mL = 0;
    mR = width;
    mT = 0;
    mB = height;


    pullData();

}

function changeMode(n) {
    graphMode = n;
    pullData();
}

function friendsModeEngage(n) {

    friendsMode = !friendsMode;

    if (friendsMode)
        friendsMultiplier = n;
    else
        friendsMultiplier = 1;

    pullData();
}

function draw() {
    background(255);

    if (statsReady) {
        // lastX = gp[0].x;
        // lastY = gp[0].y;

        // 5 friends
        if (friendsMode) {
            noStroke();
            fill(255, 200, 200);
            beginShape();
            var mappedY = mB - (mB - gp[0].y) * 5;
            vertex(gp[0].x, mappedY);

            for (var i = 1; i < gp.length; i++) {
                mappedY = mB - (mB - gp[i].y) * 5;
                vertex(gp[i].x, mappedY);
            }

            vertex(mL, mB);
            vertex(mR, mB);

            endShape();

        }

        // display points
        stroke(255, 0, 0);
        fill(255, 0, 0);

        beginShape();
        vertex(gp[0].x, gp[0].y);

        for (var i = 1; i < gp.length; i++) {
            vertex(gp[i].x, gp[i].y);
        }

        vertex(mL, mB);
        vertex(mR, mB);

        endShape();



        for (var i = 0; i < gp.length; i++) {
            if (!gp[i].inPosition) {
                gp[i].getIntoPosition();
                // gp[i].display(color(255, 0, 0));

            } else {
                reDraw = false;
                gp[i].getIntoPosition();
                // gp[i].display(color(255, 0, 0));
                gp[i].checkMouse();
            }

            lastX = gp[i].x;
            lastY = gp[i].y;
        }

        // update & display points
        if (friendsMode) {
            for (var i = 0; i < gp_friends.length; i++) {
                if (!gp_friends[i].inPosition) {
                    gp_friends[i].getIntoPosition();
                    gp_friends[i].display(color(255, 255, 0));

                } else {
                    gp_friends[i].display(color(255, 255, 0));
                    gp_friends[i].checkMouse();
                }

                lastX = gp_friends[i].x;
                lastY = gp_friends[i].y;
            }
        }
    }
}


// graph point class
function GP(x, y, val, label) {

    this.x = x;

    this.y = mB;
    this.endY = y;

    this.inPosition = false;

    // arbitrary data value
    this.val = val;
    this.label = label;

    this.setup = function(x, y, val, label) {
        this.x = x;

        this.endY = y;

        this.inPosition = false;

        // arbitrary data value
        this.val = val;
        this.label = label;
    }

    this.getIntoPosition = function() {
        this.y = lerp(this.y, this.endY, .1);
        var theDist = abs(this.y - this.endY);
        if (theDist < .5) this.inPosition = true;
    };

    this.display = function(c) {

    };

    this.checkMouse = function() {
        var theDist = dist(this.x, this.y, mouseX, mouseY);

        if (theDist < 10) {


            // adjust value context if necessary
            var valToPrint = this.val;
            if (graphMode == TOTALRAISED) valToPrint = "$" + valToPrint;

            // constrain positioning
            var y = mouseY + 21;
            //var x = constrain(mouseX + 80, 0, width * .925);
            var x = mouseX + 80;

            $("#stats-line").css("left", x + "px");
            //$("#mouse-info").offset({ top: y, left: x});
            // $("#mouse-info #val").text(valToPrint.toFixed(2));
            // $("#mouse-info #date").text(this.label);

            $("#stats-date").text(this.label);
            $("#scrub-actual").offset({ top: y, left: x});
            $("#scrub-actual").text(valToPrint);

            y = height - (height - this.y) * 5;
            y += 21;
            y = constrain(y,40,height);
            $("#scrub-friends").offset({ top: y, left: x});
            $("#scrub-friends").text(valToPrint * friendsMultiplier);
        }
    };
}

function redrawGraph(stats, numWorkers) {

    // new p5js stuff

    // total raised XMR:
    var totalXMR = (stats[0].stats.amtPaid + stats[0].stats.amtDue) / 1000000000000;

    // USD
    var totalUSD = totalXMR * stats[0].ticker.price;

    // people free
    var peopleFree = (totalUSD / 910).toFixed(0);

    if (friendsMode) {
        peopleFree *= friendsMultiplier;
        totalUSD *= friendsMultiplier;
        totalXMR *= friendsMultiplier;
    }

    // $("#stats-text").css("top", mT + "px");
    // $("#stats-text").css("left", mL + 4 + "px");
    $("#numWorkers").text(numWorkers);
    $("#totalUSD").text("$" + totalUSD.toFixed(0));
    $("#peopleFree").text(peopleFree);

    // useful intel:

    // number of miners:
    // Object.keys(stats[i].miners).length - 1

    // amount due:
    // stats[i].stats.amtDue / 1000000000000).toFixed(4)

    // amount paid:
    // stats[i].stats.amtPaid / 1000000000000).toFixed(4)

    // hash rate:
    // stats[i].stats.hash




    // console.log(stats);

    // stats returns 167 member JSON array, 0 is the newest


    yMin = 0.0;
    yMax = 0.0;

    // find Y max first
    if (graphMode != TOTALRAISED) {
        for (var i = stats.length - 1; i >= 0; i--) {

            var compare = 0.0;

            switch (graphMode) {
                case HASHRATE:
                    compare = stats[i].stats.hash / 1000.0;
                    break;
                case PEOPLEMINING:
                    compare = Object.keys(stats[i].miners).length - 1;
                    break;
            }

            if (friendsMode) compare *= friendsMultiplier;

            if (compare > yMax) yMax = compare;
        }
    } else {
        yMax = totalUSD;
        // yMin = (stats[stats.length - 1].stats.amtPaid + stats[stats.length - 1].stats.amtDue) / 1000000000000 * stats[0].ticker.price;
        // if (yMin == yMax) yMin = 0;
    }

    // add points to array
    //for (var i = stats.length - 1; i >= 0; i--) {
    for (var i = 0; i < stats.length; i++) {
        var x = map(i, stats.length - 1, 0, mL, mR);
        var y = 0.0;
        var val = 0.0;

        var date = new Date(stats[i].timestamp * 1000);
        var month = date.getMonth();
        var day = date.getDate();
        var hours = date.getHours();
        var minutes = "0" + date.getMinutes();
        var formattedTime = monthNames[month] + ' ' + day + ' @ ' + hours + ':' + minutes.substr(-2);

        switch (graphMode) {
            case HASHRATE:
                // want it in kHash
                val = stats[i].stats.hash / 1000.0;
                y = map(val, yMin, yMax, mB, mT);
                break;
            case PEOPLEMINING:
                val = Object.keys(stats[i].miners).length - 1;
                y = map(val, yMin, yMax, mB, mT);
                break;
            case TOTALRAISED:
                val = (stats[i].stats.amtDue + stats[i].stats.amtPaid) / 1000000000000;
                val = val * stats[0].ticker.price;
                y = map(val, yMin, yMax, mB, mT);
                val = val.toFixed(0);

                break;
        }


        // if this is the first load, add new objects, otherwise just update
        if (firstLoad) {
            gp.push(new GP(x, y, val, formattedTime));
            gp_friends.push(new GP(x, map(val * friendsMultiplier, yMin, yMax, mB, mT), val * friendsMultiplier, formattedTime));

        } else {

            gp[i].setup(x, y, val, formattedTime);
            gp_friends[i].setup(x, map(val * friendsMultiplier, yMin, yMax, mB, mT), val * friendsMultiplier, formattedTime);
        }
    }
    firstLoad = false;
    statsReady = true;
}

function pullData() {
    $.ajax({
        url: "https://bb.darkinquiry.com?n=200&step=48",
        type: 'get',
        cache: false,
        success: function(stats) {
            // console.log(stats);

            var numWorkers = Object.keys(stats[0].miners).length - 1;

            exchangeRate = stats[0].ticker.price;

            redrawGraph(stats, numWorkers);

            // re-render all the labels and stuff
            $("#x-label").text(labels[graphMode]);

            var l1, l2 = "";
            switch (graphMode) {
                case HASHRATE:
                    l1 = yMax.toFixed(2);
                    l2 = yMin.toFixed(2);
                    break;
                case PEOPLEMINING:
                    l1 = yMax.toFixed(0);
                    l2 = yMin.toFixed(0);
                    break;
                case TOTALRAISED:
                    l1 = "$" + yMax.toFixed(2);
                    l2 = "$" + yMin.toFixed(2);
                    break;
            }
            $("#yTopLabel").text(l1);
            $("#yBottomLabel").text(l2);

        }
    });
}


// Pull data every 2 seconds
// setInterval(getExchangeStats, 5 * 1000)