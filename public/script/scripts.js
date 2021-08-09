window.addEventListener("scroll", function() {
    logo.style.transform = "rotate("+(window.pageYOffset/5)+"deg)";
    var top = this.window.scrollY;
    console.log(top);
});

