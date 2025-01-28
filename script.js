function startAnimations() {
  const delayAdjustment = 3; // The amount to subtract from all animation delays

  // Add animation classes to elements
  document.querySelector('.static-menu').style.animation = "fadein 0.8s ease-out";
  document.querySelector('.static-menu').style.animationDelay = `${3.76 - delayAdjustment}s`;
  document.querySelector('.static-menu').style.animationFillMode = "forwards";

  document.querySelector('.name-logo').style.animation = "fadein 0.8s ease-out";
  document.querySelector('.name-logo').style.animationDelay = `${3.38 - delayAdjustment}s`;
  document.querySelector('.name-logo').style.animationFillMode = "forwards";

  document.querySelector('#typing-container').style.animation = "slidein 0.8s ease-out";
  document.querySelector('#typing-container').style.animationDelay = `${3 - delayAdjustment}s`;
  document.querySelector('#typing-container').style.animationFillMode = "forwards";

  document.querySelector('#socials-list').style.animation = "fadein 0.8s ease-out";
  document.querySelector('#socials-list').style.animationDelay = `${3.76 - delayAdjustment}s`;
  document.querySelector('#socials-list').style.animationFillMode = "forwards";

  // for mobile
  document.querySelector('.static-menu-mobile').style.animation = "fadein 0.8s ease-out";
  document.querySelector('.static-menu-mobile').style.animationDelay = `${3.76 - delayAdjustment}s`;
  document.querySelector('.static-menu-mobile').style.animationFillMode = "forwards";

  let doubleViewLeftElements = document.querySelectorAll('.double-view-left');
  for (let elem of doubleViewLeftElements) {
    elem.style.animation = "slideInLeft 1.5s ease-out";
    elem.style.animationDelay = `${3.04 - delayAdjustment}s`;
    elem.style.animationFillMode = "forwards";
  }

  let doubleViewRightElements = document.querySelectorAll('.double-view-right');
  for (let elem of doubleViewRightElements) {
    elem.style.animation = "slideInRight 1.5s ease-out";
    elem.style.animationDelay = `${3.34 - delayAdjustment}s`;
    elem.style.animationFillMode = "forwards";
  }
}




function createTypingAnimation(id) {
  const element = document.getElementById(id);
  const text = element.getAttribute('data-text').replace(/&#10;/g, '\n');
  
  let charIndex = 0;
  let newlineCount = 0;

  // Add cursor element
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  element.appendChild(cursor);
  
  function type() {
    return new Promise((resolve, reject) => {
      function typeCharacter() {
        if (charIndex < text.length) {
          if (text.charAt(charIndex) === '\n') {
            element.insertBefore(document.createElement('br'), cursor);
            newlineCount++;
            // Start the #sub-text animation after the second newline character
            if (newlineCount === 2) {
              document.querySelector('#sub-text').style.animation = "fadein 0.8s ease-out";
              document.querySelector('#sub-text').style.animationDelay = `0.01s`;
              document.querySelector('#sub-text').style.animationFillMode = "forwards";
            }
          } else {
            element.insertBefore(document.createTextNode(text.charAt(charIndex)), cursor);
          }
          charIndex++;
          setTimeout(typeCharacter, 75); // Adjust the typing speed by changing the value (ms)
        } else {
          cursor.style.animation = "blink 1s infinite";
          resolve(); // resolve the promise when the typing is finished
        }
      }

      typeCharacter(); // start typing
    });
  }

  // run the type animation, when it is done, run the startAnimations function
  type().then(startAnimations); // startAnimations will be called when the promise returned by type resolves
}






// function loadDynamicContent() {
//   const contentDivs = document.querySelectorAll('#project-content > div');
//   const menuItems = document.querySelectorAll('.project-menu-item');
//   // menuItems[0].click();
  
//   menuItems.forEach(item => {
//     item.addEventListener('click', () => {
//       contentDivs.forEach(div => {
//         // div.classList.toggle('hidden', div.id !== item.dataset.contentId);
//         if (div.id !== item.dataset.contentId) {
//           div.classList.remove('showing');
//           div.classList.add('hidden');
//         } else {
//           div.classList.remove('hidden');
//           div.classList.add('showing');
//         }
//         if (div.id === item.dataset.contentId) {
//           const color1 = getComputedStyle(div).getPropertyValue('--project-color1');
//           const color2 = getComputedStyle(div).getPropertyValue('--project-color2');
//           const color3 = getComputedStyle(div).getPropertyValue('--project-color3');
//           document.documentElement.style.setProperty('--project-color1', color1);
//           document.documentElement.style.setProperty('--project-color2', color2);
//           document.documentElement.style.setProperty('--project-color3', color3);
//         }
//       });
//     });
//   });
// }


function loadDynamicContent() {
  const contentDivs = document.querySelectorAll('#project-content > div');
  const menuItems = document.querySelectorAll('.project-menu-item');
  let isAnimating = false;

  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      const currentShowing = document.querySelector('#project-content > div.showing');

      if (currentShowing && currentShowing.id === item.dataset.contentId) {
        return;
      }

      if (isAnimating) return;

      isAnimating = true;
      contentDivs.forEach(div => {
        const imageContainer = div.querySelector('.image-container');
        const projectInfo = div.querySelector('.project-info');

        if (div.id !== item.dataset.contentId) {
          if (div.classList.contains('showing')) {
            projectInfo.classList.add('outRight');
            imageContainer.classList.add('outLeft');
            setTimeout(() => {
              projectInfo.classList.remove('outRight');
              imageContainer.classList.remove('outLeft');
              div.classList.remove('showing');
              div.classList.add('hidden');
            }, 500);
          } else {
            div.classList.add('hidden');
          }
        } else {
          setTimeout(() => {
            projectInfo.classList.add('inRight');
            imageContainer.classList.add('inLeft');
            div.classList.remove('hidden');
            div.classList.add('showing');
            
            setTimeout(() => {
              projectInfo.classList.remove('inRight');
              imageContainer.classList.remove('inLeft');
              isAnimating = false;
            }, 500);
          }, 500);
        }

        if (div.id === item.dataset.contentId) {
          const color1 = getComputedStyle(div).getPropertyValue('--project-color1');
          const color2 = getComputedStyle(div).getPropertyValue('--project-color2');
          const color3 = getComputedStyle(div).getPropertyValue('--project-color3');
          
          gsap.to("html", {"--project-color1": color1, duration: 1});
          gsap.to("html", {"--project-color2": color2, duration: 1});
          gsap.to("html", {"--project-color3": color3, duration: 1});
        }
        
      });
    });
  });
}


function parseColor(color) {
  let arr = color.match(/[.0-9]+/g).map(Number);
  return { r: arr[0], g: arr[1], b: arr[2] };
}

function transitionColor(startColor, endColor, duration) {
  const start = parseColor(startColor);
  const end = parseColor(endColor);
  const diff = {
    r: end.r - start.r,
    g: end.g - start.g,
    b: end.b - start.b
  };

  let fps = 60;
  const steps = duration * fps;
  let step = 0;
  
  return new Promise(resolve => {
    const interval = setInterval(() => {
      const progress = step++ / steps;
      if (progress > 1) {
        clearInterval(interval);
        resolve();
      } else {
        const current = {
          r: start.r + diff.r * progress,
          g: start.g + diff.g * progress,
          b: start.b + diff.b * progress
        };
        document.documentElement.style.setProperty('--project-color1', `rgb(${current.r}, ${current.g}, ${current.b})`);
      }
    }, 1000 / fps);
  });
}


























function cursorFollow() {
  var cursor = document.querySelector(".cursor-follow");
  var circle = document.querySelector(".circle-follow");
  
  var mouseX = 0;
  var mouseY = 0;
  var circleX = 0;
  var circleY = 0;
  var cursorX = 0;
  var cursorY = 0;
  
  document.addEventListener("mousemove", function (event) {
    // mouseX = event.clientX;
    // mouseY = event.clientY;
    var adjustment = 8;
    var body = document.body.getBoundingClientRect();
    var mainBody = document.getElementById("main-body").getBoundingClientRect();
    var widthDifference = body.width - mainBody.width;
    widthDifference = widthDifference / 2;
    adjustment = 8 - widthDifference;

    // default adjustment value is 8
    if (widthDifference <= 0) {
      adjustment = 8;
    }

    mouseX = event.clientX - body.left - window.scrollX + adjustment;
    mouseY = event.clientY - body.top - window.scrollY  + 8;
  });
  
  function animate() {
    // Calculate the new positions for the circle and cursor
    circleX += (mouseX - circleX - circle.offsetWidth / 2) * 0.25;
    circleY += (mouseY - circleY - circle.offsetHeight / 2) * 0.25;

    cursorX += (mouseX - cursorX - cursor.offsetWidth / 2) * 0.6;
    cursorY += (mouseY - cursorY - cursor.offsetHeight / 2) * 0.6;
  
    cursor.style.left = cursorX + "px";
    cursor.style.top = cursorY + "px";
  
    circle.style.left = circleX + "px";
    circle.style.top = circleY + "px";
  
    // Request the next frame
    requestAnimationFrame(animate);
  }
  animate();

  document.querySelectorAll('.project-menu-item').forEach(item => {
    item.addEventListener('mouseover', () => {
      document.querySelector('.cursor-follow').classList.add('cursor-follow-clickable');
    });
  
    item.addEventListener('mouseout', () => {
      document.querySelector('.cursor-follow').classList.remove('cursor-follow-clickable');
    });
  });

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('mouseover', () => {
      document.querySelector('.cursor-follow').classList.add('cursor-follow-clickable');
    });
  
    item.addEventListener('mouseout', () => {
      document.querySelector('.cursor-follow').classList.remove('cursor-follow-clickable');
    });
  });

  document.querySelectorAll('.socials-item').forEach(item => {
    item.addEventListener('mouseover', () => {
      document.querySelector('.cursor-follow').classList.add('cursor-follow-clickable');
    });
  
    item.addEventListener('mouseout', () => {
      document.querySelector('.cursor-follow').classList.remove('cursor-follow-clickable');
    });
  });

  document.querySelectorAll('.text-link').forEach(item => {
    item.addEventListener('mouseover', () => {
      document.querySelector('.cursor-follow').classList.add('cursor-follow-clickable');
    });
  
    item.addEventListener('mouseout', () => {
      document.querySelector('.cursor-follow').classList.remove('cursor-follow-clickable');
    });
  });

  document.querySelectorAll('.name-logo').forEach(item => {
    item.addEventListener('mouseover', () => {
      document.querySelector('.cursor-follow').classList.add('cursor-follow-clickable');
    });
  
    item.addEventListener('mouseout', () => {
      document.querySelector('.cursor-follow').classList.remove('cursor-follow-clickable');
    });
  });

  document.querySelectorAll('.button-link').forEach(item => {
    item.addEventListener('mouseover', () => {
      document.querySelector('.cursor-follow').classList.add('cursor-follow-clickable');
    });
  
    item.addEventListener('mouseout', () => {
      document.querySelector('.cursor-follow').classList.remove('cursor-follow-clickable');
    });
  });

  document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("mousemove", function () {
      var cursorContainer = document.querySelector("#cursor-container");
      cursorContainer.style.opacity = "1";
    }, { once: true });
  });
}



function setupHeaderMenu() {
  const menu = document.querySelector('.moving-menu');
  const distanceThreshold = 300; // Change this value to your desired threshold
  let lastScrollTop = 0;
  window.addEventListener('scroll', () => {
      const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const isScrollingUp = currentScrollTop < lastScrollTop;
      const isPastThreshold = currentScrollTop > distanceThreshold;

      if (currentScrollTop < (distanceThreshold / 3)) {
        menu.classList.add('menu-invisible');
      } else {
        menu.classList.remove('menu-invisible');
      }

      if (isScrollingUp && isPastThreshold) {
          menu.classList.add('menu-sticky');
      } else {
        menu.classList.remove('menu-sticky');
      }

      lastScrollTop = currentScrollTop;
  });
}




























AOS.init();
// var elementVisibility = {};
// document.addEventListener('aos:in', ({ detail }) => {
//   elementVisibility[$(detail).attr('id')] = true;
// });
// document.addEventListener('aos:out', ({ detail }) => {
//   elementVisibility[$(detail).attr('id')] = false;
// });

// function isElementVisible(elementId) {
//   return elementVisibility[elementId] === true;
// }

// function isDivVisible(id) {
//   var div = document.getElementById(id);
//   return div.classList.contains('aos-animate');
// }





$(document).ready(function() {
  $('.menu-item').on('click', function(event) {
    // console.log(isDivVisible('project-header'));
    if (!$(this).is("#resume-link")) {
      event.preventDefault();
    }
    var target = this.hash;
    var offset = 40;
    switch (target) {
      case "#project-header-static":
        offset = 60;
        break;
      case "#contact":
        offset = 80;
        break;
      default:
        offset = 40;
    }

    // timing is a function of the distance to scroll, with a max and min
    var distance = Math.abs($(target).offset().top - $(window).scrollTop());
    var timing = 100 * Math.log(distance);
    timing = Math.max(timing, 300);
    timing = Math.min(timing, 1000);

    $('html, body').animate(
      {
        scrollTop: $(target).offset().top - offset,
      },
      timing,
      'easeInOutQuad', // Add this easing function for 'ease-in-out' effect
      function() {
        window.location.hash = target - offset;
      }
    );
  });
});


// for mobile project menu selection
$(document).ready(function() {
  $('.project-menu-item:first').addClass('project-menu-selected'); // This line selects the first menu item and adds the 'project-menu-selected' class.

  $('.project-menu-item').click(function() {
    $('.project-menu-item').removeClass('project-menu-selected'); // Remove the 'project-menu-selected' class from all items.
    $(this).addClass('project-menu-selected'); // Add the 'project-menu-selected' class to the clicked item.
  });
});


// Initialize Vanilla Tilt for all card elements
$(document).ready(function() {
  // Convert jQuery object to an array of DOM elements
  var cards = $('.card').get();
  console.log(cards)
  VanillaTilt.init(cards, {
    max: 10,                  // Maximum tilt rotation (degrees)
    speed: 7500,               // Speed of the enter/exit transition
    perspective: 1250,        // Transform perspective, lower = more extreme tilt
    scale: 1.02,              // 1.05 = 105% scaling on hover
    glare: false,             // Enable glare effect
    "max-glare": 0.3,         // Maximum glare opacity (0 to 1)
    gyroscope: true           // Enable tilt based on device orientation
  });
});












// $(document).ready(function() {
//   $('.project-menu-item:first').addClass('project-menu-selected'); // Select the first menu item initially.

//   // Initially position the underline
//   var firstItem = $('.project-menu-item:first');
//   var firstItemPosition = firstItem.position();
//   var firstItemWidth = firstItem.outerWidth(); // Use outerWidth to include padding and border
//   $('#underline').css({
//       'width': firstItemWidth,
//       'left': firstItemPosition.left + firstItem.offsetParent().scrollLeft() // Add scrollLeft to account for scrolling
//   });

//   // Define an event that fires after the transition ends
//   $('#underline').on('transitionend', function() {
//       $(this).css('display', 'none');
//       $('.project-menu-item.selected').css('border-bottom', '2px solid red');
//   });

//   $('.project-menu-item').click(function() {
//       $('.project-menu-item').removeClass('project-menu-selected').removeClass('selected').css('border-bottom', 'none');
//       $(this).addClass('project-menu-selected').addClass('selected');

//       // Add transition
//       $('#underline').css({
//           'display': 'block',
//           'transition': 'left 0.3s, width 0.3s'
//       });

//       // Update the underline position and width
//       var itemPosition = $(this).position().left + $(this).offsetParent().scrollLeft(); // Add scrollLeft to account for scrolling
//       var itemWidth = $(this).outerWidth(); // Use outerWidth to include padding and border
//       $('#underline').css({
//           'width': itemWidth,
//           'left': itemPosition
//       });
//   });

//   // Update the position of the underline when the menu is scrolled
//   $('#project-menu-mobile').on('scroll', function() {
//       var underline = $('#underline');
//       var transitionIsFinished = underline.css('transition-duration') === '0s';
      
//       if (transitionIsFinished) {
//           // If transition has finished, remove transition and trigger 'transitionend'
//           underline.css('transition', 'none');
//           underline.trigger('transitionend');
//       }

//       var selectedItem = $('.project-menu-selected');
//       var itemPosition = selectedItem.position().left + selectedItem.offsetParent().scrollLeft(); // Add scrollLeft to account for scrolling
//       underline.css({
//           'left': itemPosition
//       });
//   });
// });


















cursorFollow();

loadDynamicContent();  

setupHeaderMenu();

const menuItems = document.querySelectorAll('.project-menu-item');
menuItems[0].click();

// window.addEventListener('load', function() {
//   createTypingAnimation('typing-text');
// });

// // wait for timed animations until the js is fully loaded to start the animations
// startAnimations();
createTypingAnimation('typing-text');






// document.addEventListener('DOMContentLoaded', function() {
//   const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
//   Promise.all(linkElements.map(link => {
//     return new Promise(resolve => link.addEventListener('load', resolve));
//   })).then(startAnimations);
// });





// Legacy stuff
// var offset = (target === "#contact") ? 80 : 40;