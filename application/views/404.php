<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>ziceinclude&trade; admin  version 1.0 online</title>
<link href="css/zice.style.css" rel="stylesheet" type="text/css" />
<link rel="stylesheet" type="text/css" href="components/tipsy/tipsy.css" media="all"/>
<script type="text/javascript" src="js/jquery.min.js"></script>
<script type="text/javascript" src="js/jquery.cycle.all.js"></script>
<script type="text/javascript" src="components/tipsy/jquery.tipsy.js"></script>
<script type="text/javascript" src="components/effect/jquery-jrumble.js"></script>
<script type="text/javascript">
          jQuery(function($){
			 $('#tv-wrap').jrumble({ x: 4,y: 0,rotation: 0 });	
			$('#tv-wrap').trigger('startRumble');		  
              $('.slides').addClass('active').cycle({
                  fx:     'none',
                  speed:   1,
                  timeout: 70
              }).cycle("resume");	
          });
</script>
<style type="text/css">
html {
	background-image: none;
}
#versionBar {
	background-color:#212121;
	position:fixed;
	width:100%;
	height:35px;
	bottom:0;
	left:0;
	text-align:center;
	line-height:35px;
}
.copyright{
	text-align:center; font-size:10px; color:#CCC;
}
.copyright a{
	color:#A31F1A; text-decoration:none
}    
</style>
</head>
<body class="error">
<div class="errorpage">
<div id="text">
  <h1> 404 Page not found!</h1>
  <h2>Oops! Sorry, an error has occured.</h2>
  
</div>
<center><a href="/index.php/dashboard">Back To Dashboard</a></center>
</div>
<div class="clear"></div>
<div id="versionBar" >
  <div class="copyright" > &copy; Copyright 2021  All Rights Reserved <span class="tip"></span> </div>
  <!-- // copyright-->
</div>
</script>
</body>
</html>