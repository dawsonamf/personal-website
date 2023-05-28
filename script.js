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
      setTimeout(type, 75); // Adjust the typing speed by changing the value (100ms)
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




$(document).ready(function() {
  $('.menu-item').on('click', function(event) {
    if (!$(this).is("#resume-link")) {
      event.preventDefault();
    }
    var target = this.hash;
    var offset = (target === "#project-header" || target === "#contact") ? 80 : 40;
    $('html, body').animate(
      {
        scrollTop: $(target).offset().top - offset,
      },
      500,
      'easeInOutCubic', // Add this easing function for 'ease-in-out' effect
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





