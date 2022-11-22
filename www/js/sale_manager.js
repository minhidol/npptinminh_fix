$(document).ready(function () {
  $('ul#main_menu li').on('click', function () {
    $('ul#main_menu li').removeClass('select');
    $(this).addClass('select');
  });

  // $('li a').click(function(event){
  //     if(!event.altKey && !event.ctrlKey && $(this).attr('href').length > 1) {
  //         document.title = $(this).text();
  //     }
  // });

    // var currenthref = window.location.href.replace(new RegExp('/|(\\?.*)','g'), '');
    // document.title = 'Dashboard';
    //     $('.limenu a').each(function(key, value) {
    //         if($(value).attr('href') != '#' && value.href.replace(new RegExp('/','g'), '') === currenthref) {
    //             document.title = value.text;
    //         }
    //     })
    var eid = setInterval(function(){
        document.title = $('span.ico.title').parent().text().trim();
        if (document.title.length > 0) {
            clearInterval(eid);
        }
    }, 200);

});

function calculatorMoney(el) {
  var id = $(el).closest('tr').data('id'),
    target = $(el).closest('tr'),
    quantity = target.children('td:nth-child(4)').children().val().trim().replace(/,/ig, ''),
    price = target.children('td:nth-child(6)').children().val().trim().replace(/,/ig, ''),
    storge = target.children('td:nth-child(4)').children().data('storge-in-house')

  if (quantity == '' || isNaN(quantity))
    return false;
  if (price == '' || isNaN(price))
    return false;
  if (quantity > storge) {
    alert('hết sản phẩm')
    target.children('td:nth-child(4)').children().val('')
    return false;
  }

  var bill = parseInt(quantity) * parseInt(price);
  $('#show_bill_product_' + id).html('<h4>' + numeral(bill).format('0,0') + '</h4>');
  $('#txt_hide_' + id).val(bill)
  var total_bill = 0;
  $('.bill_product').each(function () {
    if (this.value != '') {
      total_bill += parseInt(this.value);
    }
  })
  $('#total_bill').text(numeral(total_bill).format('0,0'));
  $('#txt_hide_total_bill').val(total_bill);

}

function loadUnitProduct(el, sale) {
  var id = $(el).closest('tr').data('id');
  var target = $(el).closest('tr');
  var product_id = target.children('td:nth-child(3)').children().val();
  var type = $('#type_sale_product').val();
  $.ajax({
    type: 'POST',
    dataType: 'json',
    url: config.base + '/product_sale_price?product_id=' + product_id + '&type=' + type,
    success: function (respone) {
      //var html_select = '';
      //for (var x in respone.unit) {
      //    html_select += '<option value="' + respone.unit[x].id + '">' + respone.unit[x].name + '</option>'
      //}
      //$('#tr_product_buy_price_' + id + ' td.load_unit').html('<select onchange="selectPrice(this,true)" data-placeholder="ch�?n quy cách" class="chzn-select">' + html_select + '</select>');
      //$(' select').not("select.chzn-select,select[multiple],select#box1Storage,select#box2Storage").selectmenu({
      //    style: 'dropdown',
      //    transferClasses: true,
      //    width: null
      //});
      //
      //$(".chzn-select").chosen();
      $('#tr_product_buy_price_' + id + ' td.load_unit').text(respone.unit[0].name)
      if (sale) {
        if (type == 'wholesale')
          target.children('td:nth-child(6)').children().val(numeral(respone.unit[0].price).format('0,0'));
        else {
          target.children('td:nth-child(6)').children().val(numeral(respone.unit[respone.unit.length - 1].price).format('0,0'));

        }
        target.children('td:nth-child(4)').children().attr('placeholder', respone.storge);
        target.children('td:nth-child(4)').children().attr('data-storge-in-house', respone.storge_in_house);
      }

    }
  })
}

function selectPrice(el, sale) {
  $.ajax({
    type: "GET",
    dataType: 'json',
    url: config.base + '/warehouse_wholesale_sale/getPrice?id=' + el.value,
    success: function (respone) {
      if (respone && sale) {
        $(el).parent().next().children().val(respone.price)
        $(el).parent().prev().children().trigger('onkeyup')
      }
    }
  })
}

function dividedQuantity(el) {
  var value = (el.value != '') ? parseInt(el.value) : 0,
    product_id = $(el).data('product-id'),
    warehouse_id = $(el).data('warehouse-id'),
    warehouse_primary = parseInt($('#product_quantity_' + product_id).text()),
    total = 0

  $('.storge_product_' + product_id).each(function () {
    if (!isNaN(this.value) && this.value != '')
      total += parseInt(this.value)
  })
  if (warehouse_primary - total < 0) {
    alert("hết sản phẩm trong kho");
    el.value = '';
    return false;
  }
  $('#warehouse_' + product_id).val(warehouse_primary - total)
}
var formatPrice = function (el) {
  var value = el.value.replace(/,/ig, '')
  if (value.trim() == '')
    return false
  if (isNaN(value)) {
    el.value = ''
    alert('vui lòng nhập số')
    return false
  }
  el.value = numeral(value).format('0,0')
}
