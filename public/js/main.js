$(document).ready(function(){

    $(".delete-eBook").on("click", function(e){

        $target = $(e.target);
        const id = $target.attr("data-id");

        $.ajax({
            type: "DELETE",
            url: "/eBook/" + id,
            success: function(response){

                alert("Deleting Yoga eBook");
                window.location.href="/";
            },
            error: function(err){
                console.log(err);
            }
        })
    })
});
