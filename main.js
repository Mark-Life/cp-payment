//public code

  // Pause function for loading analytics
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Function for generating a unique order number
  function uniqueID() {
    return Math.floor(Math.random() * Date.now())
  }

  // Function whether the object appears in the viewing area for analytics
  function isInViewport(el) {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  }

  let donation_form = document.querySelector('#donation_form');
  let amount = document.querySelectorAll('input[name="price"]');
  let custom_amount = document.querySelector('#custom_price');

  let visible_flag = 0;
  document.addEventListener('scroll', function () {
    if (isInViewport(donation_form)) {
      if (visible_flag === 0) {
        console.log('Donation form in the field of visibility');
        //Analytics code
        visible_flag = 1;
      }
    }
  }, {
    passive: true
  });

  $(document).ready(function () {

    // Hide or show fields depending on the selected regularity
    $(".recurrent_field input").change(function () {

      let email_block = $('.email_field');
      let email_input = document.getElementById("email");
      let subscribe_confirmation_block = $('.subscribe_confirmation');
      let subscribe_confirmation_input = document.getElementById("subscribe_confirmation");
      let recurrent_block = $('#recurrent');

      if ($('#recurrent_choice_1').prop("checked")) {

        recurrent_block.fadeIn(300);
        email_input.required = true;
        email_block.fadeIn(300);
        subscribe_confirmation_block.fadeIn(300);
        subscribe_confirmation_input.required = true;

      } else {

        recurrent_block.fadeOut(300);
        email_input.required = false;
        // email_block.fadeOut(300);
        subscribe_confirmation_block.fadeOut(300);
        subscribe_confirmation_input.required = false;

      }
    });
  });


  // Selecting a donation amount
  $(document).ready(function () {
      // Initial state 0
      let flag = 0;
      // If the state has changed
      amount.forEach(function (price) {
        price.onchange = function (e) {
          if (this.checked && flag == 0) {
            console.log('Donation amount selected');
            // Analytics code
            $(this).prop("checked", true);
            flag = 1;
          }
          console.log('Clearing custom amount')
          custom_amount.value = "";
        };
      });
      // If the state has changed
      custom_amount.onchange = function (e) {
        if (this.value > 0 && flag == 0) {
          console.log('Donation amount selected');
          // Analytics code
          $(this).prop("checked", true);
          flag = 1;
        }
        console.log('Clearing selected amount')
        amount.forEach(function (price) {
          price.checked = false;
        });
      };
    }
  );

  this.pay = function () {

    let widget = new cp.CloudPayments();

    let amount = parseFloat($("input[name='price']:checked").val());
    let custom_amount = parseFloat($("input[name='custom_price']").val());
    let recurrent = 'one-time';
    let firstName = $("#firstName").val();
    let lastName = $("#lastName").val();
    let email = $("#email").val();
    let order_id = uniqueID();
    let url_link = window.location.href;

    if (amount === undefined || isNaN(amount)) {

        console.log('Using custom amount')
        // If there is no selected amount
        amount = custom_amount;

    };

    // Function to get parameter from URL
    function getParameterByName(name, url) {
      if (!url) url = window.location.href;
      name = name.replace(/[\[\]]/g, "\\$&");
      let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
      if (!results) return null;
      if (!results[2]) return '';
      return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    // Getting a parameter from a URL. Change parameterName to real parameter you want to get
    let parameterName = getParameterByName('parameterName');

    let data = {
      "email": email,
      "firstName": firstName,
      "lastName": lastName,
      "amount": amount,
      "url_link": url_link,
      "parameterName": parameterName // Change parameterName to real parameter you want to send to Google Spreadsheet
    };

    if (parameterName) {
      console.log('Parameter has been found and connected');
    } else {
      console.log('Donation without parameter');
    }

    /*
    TEST: After configuring Google App Script, you can test the script's performance. 
    If you activate this block, the data will be sent after the widget is called, not after payment. 
    (same code below, after successful payment)
    */
    /*
    $.ajax({
      type: "POST",
      url: "", // Paste the URL of your Google App Script Deployment
      data: JSON.stringify(data),
      success: function(response) {
        console.log('The data was successfully added to the Google Spreadsheet');
      },
      error: function(error) {
        console.error('Error sending data to Google Spreadsheet:', error);
      }
    });
    */    
        
    let product = {
      "name": "Donation",
      "price": amount,
      "quantity": 1,
    };

    if (recurrent === 'monthly') {

      console.log('Monthly donation')
      data.CloudPayments = {recurrent: {interval: 'Month', period: 1,}};
      product.name = "Monthly donation";

    } else {

      console.log('One-time donation')
      product.name = "One-time donation";

    }

    console.log('Adding to cart')
    window.dataLayer.push({
      "ecommerce": {
        "currencyCode": "USD",
        "add": {
          "products": [product]
        }
      }
    })
    
    // Analytics code
    console.log('New attempt to donate');

    widget.pay('auth',
      {
        publicId: publicId,
        description: '', // Insert the name of the payment (will be wisible to user)
        amount: amount,
        currency: 'USD',
        accountId: email,
        invoiceId: order_id,
        skin: 'mini',
        data: JSON.stringify(data)
      },
      {
        onFail: function (reason, options) {
          console.log('Removing from cart')
          window.dataLayer.push({
            "ecommerce": {
              "currencyCode": "USD",
              "remove": {
                "products": [product]
              }
            }
          })

          // Analytics code
          console.log('Donation has been canceled');

          sleep(2000).then(() => {
            window.location = '/failed-donate'; // redirect to the page after failed donation
          });
        },
        onComplete: function (paymentResult, options) {

          // If the donation is successful
          if (paymentResult.success === true) {

            console.log('Mark the item as paid')
            window.dataLayer.push({
              "ecommerce": {
                "currencyCode": "USD",
                "purchase": {
                  "actionField": {
                    "id": order_id,
                  },
                  "products": [product]
                }
              }
            })

            // Analytics code
            console.log('New successful donation');

            // Sending data of successful donation to Google Spreadsheet
            $.ajax({
              type: "POST",
              url: "", // Paste the URL of your Google App Script Deployment
              data: JSON.stringify(data),
              success: function(response) {
                console.log('The data was successfully added to the Google Spreadsheet');
              },
              error: function(error) {
                console.error('Error sending data to Google Spreadsheet:', error);
              }
            });

            sleep(2000).then(() => {
              window.location = '/thanks-for-donate'; // redirect to the page after successful donation
            });

          } else {

            console.log('Removing from the cart')
            window.dataLayer.push({
              "ecommerce": {
                "currencyCode": "USD",
                "remove": {
                  "products": [product]
                }
              }
            })

            //Analytics code
            console.log('The donation failed');

            sleep(2000).then(() => {
              window.location = '/failed-donate';
            });

          }
        }
      }
    )

  }

  // Capture the form submission and call CloudPayments Widget
  $('#donation_form').submit(function (e) {
      pay();
      e.preventDefault();

    }
  );
