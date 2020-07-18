// jquery code  for showing and hiding the hiden form ( not working )
$(document).ready(function(){
    $('.form-container').hide(); // for the form
    $('.hide_btn').on('click', function(){ //for  select button
      $('.form-container').toggle(); // for the form
    })
  })