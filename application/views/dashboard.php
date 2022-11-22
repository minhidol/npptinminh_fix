<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
	<meta name="description" content="" />
	<meta name="keywords" content="" />

	<title>Dashboard</title>
	<link type="text/css" rel='stylesheet' href="/www/css/ui-custom.css" />
	<link type="text/css" rel='stylesheet' href="/www/css/zice.style.css" />
	<link type="text/css" rel='stylesheet' href="/www/css/icon.css" />
	<link rel="stylesheet" type="text/css" href="/www/css/dataTables.css"  />
	<link rel="stylesheet" type="text/css" href="/www/css/chosen.min.css"  />
	<link rel="stylesheet" type="text/css" href="/www/css/fixed_table_rc.css"  />
	<link rel="stylesheet" type="text/css" href="/www/css/bootstrap.min.css"  />
	<link rel="stylesheet" type="text/css" href="/www/css/bootstrap-select.min.css"  />    
	<link rel="stylesheet" type="text/css" href="/www/css/promotion.css"  />
    <link rel="stylesheet" type="text/css" href="/www/css/bootstrap-datepicker.min.css"  />
    <link rel="stylesheet" type="text/css" href="/www/css/page-break-print.css"  />
    <link rel="stylesheet" type="text/css" href="/www/css/print.style.css"  />

	<link rel="stylesheet" type="text/css" href="/www/css/datatables.min.css"  />

    <script>
        var config = {base: "<?php echo site_url()?>"};
        const ROLE = <?php echo $user->role; ?>;
    </script>
	<script type="text/javascript" src="/www/js/jquery-3.2.1.min.js"></script>
	<script type="text/javascript" src="/www/js/jquery-migrate-3.0.0.js"></script>    

	<script type="text/javascript" src="/www/js/jquery.cookie.js"></script>
	<script type="text/javascript" src="/www/js/jquery.ui.min.js"></script>
	<script type="text/javascript" src="/www/js/datatables.min.js"></script>
	<script type="text/javascript" src="/www/js/ColVis.js"></script>
	<script type="text/javascript" src="/www/js/component/chosen.jquery.min.js"></script>
	<script type="text/javascript" src="/www/js/component/customInput.jquery.js"></script>
	<script type="text/javascript" src="/www/js/component/numeral.min.js"></script>
	<!-- <script type="text/javascript" src="/www/js/component/bootstrap.min.js"></script> -->
	<script type="text/javascript" src="/www/js/fixed_table_rc.js"></script>

	<!-- <script type="text/javascript" src="/www/js/bootbox.min.js"></script> -->
	<script src="/www/js/jquery-1.11.1.min.js"></script>
	<script type="text/javascript" src="/www/js/bootbox.min.js"></script>
	<script type="text/javascript" src="/www/js/component/bootstrap.min.js"></script>
	<script type="text/javascript" src="/www/js/bootstrap-select.js"></script>
	<script src="/www/js/jquery.ui.1.11.1.min.js"></script>
	<script src="/www/js/bootstrap-datepicker.min.js"></script>

	<script src="/www/js/angular/angular.min.js"></script>
	<script src="/www/js/angular-route/angular-ui-router.js"></script>

	<script src="/www/js/app.js"></script>
	<script src="/www/js/services.js"></script>
	<script src="/www/js/filters.js"></script>
	<script src="/www/js/directives.js"></script>
	<script src="/www/js/angular/ui-bootstrap.min.js"></script>
	<script src="/www/js/sale_manager.js"></script>

	<!-- include controllers -->
	<script src="/www/js/controllers.js"></script>
    <script src="/www/js/controllers.promotion.js"></script>
    <script src="/www/js/controller.order.js"></script>
    <script src="/www/js/controller.statistic.js"></script>

    <style type="text/css">
        @media screen {
            #printSection {
                display: none;
            }
        }

        @media print {
            body div {
                visibility:hidden;
                display: none;
            }
            #printSection, #printSection div {
                visibility:visible;
                display: block;
            }
            #printSection {
                display: block;
                /*position:absolute;*/
                /*left:0;*/
                /*top:0;*/
            }
        }
    </style>
</head>

<body class="dashborad A5">
	<div id="overlay"></div>
	<div id="alertMessage" class="error"></div>
	<div id="header" >
		<div id="account_info">
			<div class="setting" title="Thông tin tài khoản">
				<b>Chào, </b>
				<b class="red">&nbsp; <?php echo $user->user_name ?></b>
			</div>

			<div class="logout" title="Đăng xuất">
                <a href='<?php echo site_url() ?>/login/logout'><b >Đăng xuất</b>
					<img src="/www/img/connect.png" name="connect" class="disconnect" alt="Đăng xuất" >
				</a>
			</div>
		</div>
	</div> <!--//  header -->
	<div id="shadowhead" style="display: block; position: absolute;"></div>
	<div id="left_menu"><?php include 'include/left_menu.html'; ?></div>
	<div id="content" ng-app="dashboard">
		<div class="inner">
			<div class="topcolumn"><div class="logo"></div></div>
			<div class="clear"></div>
			<div ui-view="content"></div>
			<div class="clear"></div>
		</div> <!--// End inner -->
	</div> <!--// End content -->

	<!-- Modal -->
	<div id="myModal" class="modal fade" role="dialog">
		<div class="modal-dialog">

			<!-- Modal content-->
			<div class="modal-content">
				<div class="modal-header modal-header-success" id="myModalHeader">
					<button type="button" class="close" data-dismiss="modal">&times;</button>
					<h4 class="modal-title" style="border: none;">Modal Header</h4>
				</div>
				<div class="modal-body">
					<p >Some text in the modal.</p>
				</div>
				<div class="modal-footer">
					<button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
				</div>
			</div>

		</div>
	</div>

	<script type="text/javascript">
		function showMessage(type, message) {
			var modalType = 'modal-header-' + type;
			$("#myModalHeader").prop('class','modal-header ' + modalType);
			$('#myModal .modal-title').html(type);
			$('#myModal .modal-body p').html(message);
			$('#myModal').modal('show');
		}
		$(document).ready(function(){
            $('body').on('click', function (e) {
                if (!$(e.target).hasClass('show-popover')) {
                    $('.show-popover').popover('hide');
                }
            });
        })
	</script>
</body>

</html>
