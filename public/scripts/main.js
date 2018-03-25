function update() {
	// Log something on the browser console
	console.log("Updating weekly summary...");

    var xmlhttp = new XMLHttpRequest();
    console.log(xmlhttp);

    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
           if (xmlhttp.status == 200) {
               console.log('Status is OK');
            //    updatePage(xmlhttp.responseText);

            console.log("Updating the divs with these results: " + xmlhttp.responseText);
            var week = JSON.parse(xmlhttp.responseText);
        
            var weekWorkTime = 0;
            var weekAvailableTime = 0;
            var weekTotalTime = 0;

            for (var day in week) {
                console.log(week[day]);   
                weekWorkTime += parseInt(week[day]["total_work_time_day"]);
                weekAvailableTime += parseInt(week[day]["total_available_time_day"]);
            }

            weekTotalTime = weekAvailableTime - weekWorkTime;
            
            console.log(weekWorkTime);
            console.log(weekAvailableTime);
            console.log(weekTotalTime);
            
            document.getElementById("week-work-time").innerHTML = weekWorkTime;
            document.getElementById("week-available-time").innerHTML = weekAvailableTime;
            if (weekTotalTime > 0) {
                document.getElementById("week-total-time").innerHTML = "+" + weekTotalTime;                
            } else {
                document.getElementById("week-total-time").innerHTML = weekTotalTime;
            }

           }
           else if (xmlhttp.status == 400) {
              alert('There was an error 400');
           }
           else {
               alert('something else other than 200 was returned');
           }
        }
    };

    // TODO: I need to get the book name from the form here...

    xmlhttp.open("GET", "/weeklyUpdate", true);
    xmlhttp.send();	
}

function updatePage(results) {
	console.log("Updating the divs with these results: " + results);
    console.log("Back from the server with: " + xmlhttp.responseText);
}