function update() {
	console.log("Updating weekly summary...");

    var xmlhttp = new XMLHttpRequest();
    console.log(xmlhttp);

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
               console.log('Status is OK');
               updatePage(xmlhttp.responseText);
           }
           else if (xmlhttp.status == 400) {
              alert('There was an error 400');
           }
           else {
               alert('Something else other than 200 was returned');
           }
        }
    };

    xmlhttp.open("GET", "/weeklyUpdate", true);
    xmlhttp.send();	
}

function updatePage(results) {
    console.log("Updating the divs with these results: " + results);
    var week = JSON.parse(results);

    var weekWorkTime      = 0.0;
    var weekAvailableTime = 0.0;
    var weekTotalTime     = 0.0;

    for (var day in week) {
        weekWorkTime      += parseFloat(week[day]["total_work_time_day"]);
        weekAvailableTime += parseFloat(week[day]["total_available_time_day"]);
    }

    weekTotalTime = weekAvailableTime - weekWorkTime;
    
    console.log(weekWorkTime);
    console.log(weekAvailableTime);
    console.log(weekTotalTime);
    
    document.getElementById("week-work-time").innerHTML = weekWorkTime;
    document.getElementById("week-available-time").innerHTML = weekAvailableTime;
    if (weekTotalTime > 0) {
        document.getElementById("week-total-time").innerHTML = "<span style='color: green'>+" + weekTotalTime + "</span>";                
    }
    else if (weekTotalTime < 0) {
        document.getElementById("week-total-time").innerHTML = "<span style='color: red'>" + weekTotalTime + "</span>";                
    } else {
        document.getElementById("week-total-time").innerHTML = weekTotalTime;
    }
}

function login() {
    console.log('Logging in...');
	var username = $("#username").val();
    var password = $("#password").val();

	var params = {
		username: username,
		password: password
	};

	$.post("/login", params, function(result) {
        console.log("result: " + result);
		if (result && result.success) {
            console.log("Successfully logged in.");
            window.location.replace("/");
		} else {
			console.log("Error logging in.");
			console.log("Error:" + result.data);
			alert("Error logging in");
		}
	});
}

function signup() {
    console.log('SIgning up...');
	var username = $("#username").val();
    var password = $("#password").val();
    
	var params = {
		username: username,
		password: password
	};

	$.post("/signup", params, function(result) {
        console.log("result: " + JSON.stringify(result));
		if (result && result.success) {
            console.log("Successfully signed up.");
            alert("Successfully signed up. Welcome aboard!");
            window.location.replace("/");
		} else {
			console.log("Error signing up.");
			alert("Error signing up");
		}
	});
}

function logout() {
    console.log('Logging out...');
	$.post("/logout", function(result) {
		if (result && result.success) {
			console.log("Successfully logged out.");
            window.location.replace("/");
		} else {
			console.log("Error logging out.");
		}
	});
}