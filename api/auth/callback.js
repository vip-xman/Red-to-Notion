// OAuth callback endpoint for Notion authorization
export default async function handler(req, res) {
  // Enable CORS for Chrome extension
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, state, error } = req.query;

    // If there's an error in authorization
    if (error) {
      return res.status(400).json({ 
        error: 'Authorization failed', 
        details: error 
      });
    }

    // If we have a code, this is a successful callback
    if (code) {
      // For Chrome Extension OAuth flow, we need the page to be accessible
      // chrome.identity.launchWebAuthFlow will capture this URL automatically
      return res.status(200).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>🎉 连接成功啦！</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              overflow: hidden;
            }
            
            .container {
              background: white;
              border-radius: 20px;
              padding: 40px;
              text-align: center;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              max-width: 450px;
              margin: 20px;
              position: relative;
              animation: slideUp 0.6s ease-out;
            }
            
            @keyframes slideUp {
              from {
                opacity: 0;
                transform: translateY(30px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .success-icon {
              font-size: 80px;
              margin-bottom: 20px;
              animation: bounce 0.8s ease-out 0.5s both;
            }
            
            @keyframes bounce {
              0%, 20%, 53%, 80%, 100% {
                animation-timing-function: cubic-bezier(0.215, 0.610, 0.355, 1.000);
                transform: translateZ(0);
              }
              40%, 43% {
                animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
                transform: translate3d(0, -15px, 0);
              }
              70% {
                animation-timing-function: cubic-bezier(0.755, 0.050, 0.855, 0.060);
                transform: translate3d(0, -7px, 0);
              }
              90% {
                transform: translate3d(0, -2px, 0);
              }
            }
            
            .main-title {
              font-size: 28px;
              font-weight: bold;
              color: #333;
              margin-bottom: 16px;
              animation: fadeIn 0.8s ease-out 0.8s both;
            }
            
            .subtitle {
              font-size: 16px;
              color: #666;
              margin-bottom: 24px;
              line-height: 1.5;
              animation: fadeIn 0.8s ease-out 1s both;
            }
            
            .funny-text {
              background: linear-gradient(135deg, #ff6b35, #f7931e);
              color: white;
              padding: 16px 20px;
              border-radius: 12px;
              margin: 20px 0;
              font-size: 15px;
              animation: fadeIn 0.8s ease-out 1.2s both;
            }
            
            .instruction {
              font-size: 14px;
              color: #888;
              margin-top: 20px;
              animation: fadeIn 0.8s ease-out 1.4s both;
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(10px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            
            .countdown {
              display: inline-block;
              font-weight: bold;
              color: #667eea;
            }
            
            .confetti {
              position: absolute;
              width: 10px;
              height: 10px;
              background: #ff6b35;
              animation: confetti-fall 3s linear infinite;
            }
            
            @keyframes confetti-fall {
              0% {
                transform: translateY(-100vh) rotate(0deg);
              }
              100% {
                transform: translateY(100vh) rotate(720deg);
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success-icon">🎉</div>
            <h1 class="main-title">牵手成功！</h1>
            <p class="subtitle">
              恭喜你和 Notion 完成了一次完美的"数字相亲"！<br>
              现在你们已经是好朋友了～
            </p>
            
            <div class="funny-text">
              🚀 数字红娘 Red To Notion 为你们搭桥成功！<br>
              现在可以愉快地剪藏小红书内容了！
            </div>
            
            <p class="instruction">
              📱 这个页面的使命已经完成，<span class="countdown">3</span>秒后华丽退场<br>
              🔙 请回到浏览器插件继续你的剪藏之旅吧！
            </p>
          </div>

          <script>
            console.log('OAuth callback page loaded with code: ${code}');
            
            // 生成彩带动画
            function createConfetti() {
              const colors = ['#ff6b35', '#f7931e', '#667eea', '#764ba2', '#28a745'];
              for (let i = 0; i < 15; i++) {
                setTimeout(() => {
                  const confetti = document.createElement('div');
                  confetti.className = 'confetti';
                  confetti.style.left = Math.random() * 100 + '%';
                  confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                  confetti.style.animationDelay = Math.random() * 3 + 's';
                  confetti.style.animationDuration = (Math.random() * 2 + 2) + 's';
                  document.body.appendChild(confetti);
                  
                  setTimeout(() => {
                    confetti.remove();
                  }, 5000);
                }, i * 200);
              }
            }
            
            // 倒计时功能
            let countdown = 3;
            const countdownEl = document.querySelector('.countdown');
            
            const countdownInterval = setInterval(() => {
              countdown--;
              if (countdownEl) {
                countdownEl.textContent = countdown;
              }
              
              if (countdown <= 0) {
                clearInterval(countdownInterval);
                if (countdownEl) {
                  countdownEl.parentElement.innerHTML = '👋 拜拜~ 页面正在关闭...';
                }
                
                setTimeout(() => {
                  console.log('Attempting to close window');
                  if (window.close) {
                    window.close();
                  }
                }, 500);
              }
            }, 1000);
            
            // 启动彩带动画
            setTimeout(createConfetti, 1000);
            
            // 点击任意位置也可以关闭
            document.addEventListener('click', () => {
              clearInterval(countdownInterval);
              if (window.close) {
                window.close();
              }
            });
          </script>
        </body>
        </html>
      `);
    }

    // If no code or error, show generic success page
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Red To Notion</title>
      </head>
      <body>
        <h2>Red To Notion Authorization</h2>
        <p>Authorization endpoint</p>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}