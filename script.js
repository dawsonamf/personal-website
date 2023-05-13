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

function loadDynamicContent() {
  const contentDivs = document.querySelectorAll('#project-content > div');
  const menuItems = document.querySelectorAll('.project-menu-item');
  // menuItems[0].click();
  
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      contentDivs.forEach(div => {
        // div.classList.toggle('hidden', div.id !== item.dataset.contentId);
        if (div.id !== item.dataset.contentId) {
          div.classList.remove('showing');
          div.classList.add('hidden');
        } else {
          div.classList.remove('hidden');
          div.classList.add('showing');
        }
        if (div.id === item.dataset.contentId) {
          const color1 = getComputedStyle(div).getPropertyValue('--project-color1');
          const color2 = getComputedStyle(div).getPropertyValue('--project-color2');
          const color3 = getComputedStyle(div).getPropertyValue('--project-color3');
          document.documentElement.style.setProperty('--project-color1', color1);
          document.documentElement.style.setProperty('--project-color2', color2);
          document.documentElement.style.setProperty('--project-color3', color3);
        }
      });
    });
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
    mouseX = event.clientX - body.left - window.scrollX  + adjustment;
    mouseY = event.clientY - body.top - window.scrollY  + adjustment;
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

  document.addEventListener("DOMContentLoaded", function() {
    document.addEventListener("mousemove", function () {
      var cursorContainer = document.querySelector("#cursor-container");
      cursorContainer.style.opacity = "1";
    }, { once: true });
  });



const menu = document.querySelector('.menu');
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
    event.preventDefault();
    var target = this.hash;
    $('html, body').animate(
      {
        scrollTop: $(target).offset().top,
      },
      500,
      'easeInOutCubic', // Add this easing function for 'ease-in-out' effect
      function() {
        window.location.hash = target;
      }
    );
  });
});


cursorFollow();

loadDynamicContent();  


window.addEventListener('load', function() {
  createTypingAnimation('header');
});

const menuItems = document.querySelectorAll('.project-menu-item');
menuItems[0].click();





