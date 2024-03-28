

let inputE = document.getElementById("playlistInput");
const spotifyAuthTokenkey = "spotifyAuthToken";


async function getAuth() {
    let token = localStorage.getItem(spotifyAuthTokenkey);
    if (token) {
        console.log("token: "+ token)
        return token

    }
    console.log("token not found, requesting token");


    const xhr = new XMLHttpRequest();
    xhr.open("POST", "https://accounts.spotify.com/api/token");
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");

    let client_id = "6f6a9f015e544939a63ec879575a305c";
    let client_secret = "2c3bbd78e5634575b890c82a2118af0e";
    const body = `grant_type=client_credentials&client_id=${client_id}&client_secret=${client_secret}`;

    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            token = JSON.parse(xhr.responseText).access_token;
            window.localStorage.setItem(spotifyAuthTokenkey, token);
        } else {
            console.log(`Error: ${xhr.status}`);
        }
    };
    xhr.send(body);
    return token;
}



function isolatePlaylistID(input) {
    //get playlist id from the user input ex:  https://open.spotify.com/playlist/4D8FCQ7dWIZScfIl3lJwoT?si=e0052f0d7f33430b
    //Id is "4D8FCQ7dWIZScfIl3lJwoT" in above case.
    let playlistId = input.substr(34, 22);


    //DO SOME ERROR CHECKING



    return playlistId;
}


async function getPlaylist(spotifyId, callback) {
    //https://developer.spotify.com/documentation/web-api/reference/get-playlists-tracks
    console.log("getting playlist");
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://api.spotify.com/v1/playlists/${spotifyId}/tracks`);
    xhr.setRequestHeader("Authorization", `Bearer ${await getAuth()}`);
    xhr.responseType = "json";
    xhr.send();
    let data;
    xhr.onloadend = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
             data = xhr.response;
            console.log(data.items.length);
            if (callback) callback(data.items,createChart);

        } else {
            console.log(`Error: ${xhr.status}`);
            if (xhr.status == 401) {
                localStorage.removeItem(spotifyAuthTokenkey);
            }
        }
    };
    
}

function getTrackIds(playlist) {
    //merge all the track ids as a big string each id seperated by commas
    let ids = "";
    for (let song in playlist) {
        if (song == playlist.length - 1) {
            ids += `${playlist[song].track.id}`;
        } else {
            ids += `${playlist[song].track.id},`;
        }
    }
    return ids;
}

async function getAudioFeatures(playlist , callback) {
    //https://developer.spotify.com/documentation/web-api/reference/get-several-audio-features
    let ids = getTrackIds(playlist);
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://api.spotify.com/v1/audio-features?ids=${ids}`);
    xhr.setRequestHeader("Authorization", `Bearer ${await getAuth()}`);

    xhr.send();
    xhr.responseType = "json";
    xhr.onload = () => {
        if (xhr.readyState == 4 && xhr.status == 200) {
            const data = xhr.response;
            console.log(data);
            if(callback) callback(playlist,data.audio_features);
        } else {
            console.log(`Error: ${xhr.status}`);
            if (xhr.status == 401) {
                localStorage.removeItem(spotifyAuthTokenkey);
            }
        }
    };
}

function buttonClick(){
    
    getPlaylist(isolatePlaylistID(inputE.value), getAudioFeatures); 
}






async function createChart(playlist, audio_features) {
    var chartData = {
        nodes: [
        ],
        edges: [
        ]
    };

    /*
    node
    {
        id:
        key:
        mode:
        bpm:
    }
    edge
{ 
    from:
    to:
    type:
}
    */


    let playlistId = isolatePlaylistID(inputE.value);

    //create nodes
    console.log(await playlist);
    for (let songN in playlist) {
        chartData.nodes.push({
            id: `${playlist[songN].track.name}`,
            key: `${audio_features[songN].key}`,
            mode: `${audio_features[songN].mode}`,
            bpm: `${Math.round(audio_features[songN].tempo)}`
        });
    }
    console.log(chartData);
    //create Edges
    for (let i = 0; i < chartData.nodes.length; i++) {
        for (let j = i + 1; j < chartData.nodes.length; j++) {
            let flag = false;
            let type;
            let keyDelta = chartData.nodes[i].key - chartData.nodes[i].key


            if(chartData.nodes[i].key == chartData.nodes[j].key && chartData.nodes[i].mode == chartData.nodes[j].mode){
                type = "Perfect Mix";
                flag = true;
            }else if(){
                //1 away
                type = "1 Away";
                flag = true;

            }else if(){
                //diagonal mix
                type = "Diagonal Mix";
                flag = true;
            }else if(){
                //scale change
                type = "Scale Change";
                flag = true;
            }
            if (flag){
                chartData.edges.push({
                    from: chartData.nodes[i].id,
                    to: chartData.nodes[j].id,
                    type: type
                })
            }

        }
    }

    var chart = anychart.graph(chartData);

    // set the title
    chart.title("Mix Map");

    // draw the chart
    chart.container("container").draw();

}