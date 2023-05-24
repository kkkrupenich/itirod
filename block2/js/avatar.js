var raiseClick = function () {
    document.getElementById("image_input").click();
}

var loadFile = function (event) {
    var reader = new FileReader();

    reader.onload = function () {
        var output = document.getElementById("avatar-img");
        output.src = reader.result;
    };
    reader.readAsDataURL(event.target.files[0]);

};