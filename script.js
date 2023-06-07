function createTypingAnimation(id) {
  const element = document.getElementById(id);
  const text = element.getAttribute('data-text').replace(/&#10;/g, '\n');
  
  let charIndex = 0;

  // Add cursor element
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  element.appendChild(cursor);
  
  function type() {
    if (charIndex < text.length) {
      if (text.charAt(charIndex) === '\n') {
        element.insertBefore(document.createElement('br'), cursor);
      } else {
        element.insertBefore(document.createTextNode(text.charAt(charIndex)), cursor);
      }
      charIndex++;
      setTimeout(type, 75); // Adjust the typing speed by changing the value (ms)
    } else {
      cursor.style.animation = "blink 1s infinite"
    }
  }
  
  type();
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

  const steps = duration * 60; // 60 fps
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
    }, 1000 / 60); // 60 fps
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


function startAnimations() {
  // Add animation classes to elements
  document.querySelector('.static-menu').style.animation = "fadein 0.8s ease-out";
  document.querySelector('.static-menu').style.animationDelay = "3.76s";
  document.querySelector('.static-menu').style.animationFillMode = "forwards";

  document.querySelector('.name-logo').style.animation = "fadein 0.8s ease-out";
  document.querySelector('.name-logo').style.animationDelay = "3.38s";
  document.querySelector('.name-logo').style.animationFillMode = "forwards";

  document.querySelector('#typing-container').style.animation = "slidein 0.8s ease-out";
  document.querySelector('#typing-container').style.animationDelay = "3s";
  document.querySelector('#typing-container').style.animationFillMode = "forwards";

  document.querySelector('#sub-text').style.animation = "fadein 0.8s ease-out";
  document.querySelector('#sub-text').style.animationDelay = "1.31s";
  document.querySelector('#sub-text').style.animationFillMode = "forwards";

  document.querySelector('#socials-list').style.animation = "fadein 0.8s ease-out";
  document.querySelector('#socials-list').style.animationDelay = "3.76s";
  document.querySelector('#socials-list').style.animationFillMode = "forwards";

  let doubleViewLeftElements = document.querySelectorAll('.double-view-left');
  for (let elem of doubleViewLeftElements) {
    elem.style.animation = "slideInLeft 1.5s ease-out";
    elem.style.animationDelay = "3.04s";
    elem.style.animationFillMode = "forwards";
  }

  let doubleViewRightElements = document.querySelectorAll('.double-view-right');
  for (let elem of doubleViewRightElements) {
    elem.style.animation = "slideInRight 1.5s ease-out";
    elem.style.animationDelay = "3.34s";
    elem.style.animationFillMode = "forwards";
  }
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
    // var offset = (target === "#contact") ? 80 : 40;
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

    // make timing a function of the distance to scroll, with a max and min
    // var distance = Math.abs($(target).offset().top - $(window).scrollTop());
    // var timing = distance / 2;

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







cursorFollow();

loadDynamicContent();  

setupHeaderMenu();

window.addEventListener('load', function() {
  createTypingAnimation('typing-text');
});

const menuItems = document.querySelectorAll('.project-menu-item');
menuItems[0].click();

// wait for timed animations until the js is fully loaded to start the animations
startAnimations();


// document.addEventListener('DOMContentLoaded', function() {
//   const linkElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
//   Promise.all(linkElements.map(link => {
//     return new Promise(resolve => link.addEventListener('load', resolve));
//   })).then(startAnimations);
// });





