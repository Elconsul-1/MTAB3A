/* ====================================================================
 * Service Worker - متابعة المراكز
 * - دعم أساسي للتثبيت كتطبيق (PWA) وتخزين مؤقت بسيط للواجهة
 * - استقبال إشعارات Push فى الخلفية عبر Firebase Cloud Messaging
 * ==================================================================== */

const CACHE_NAME = 'mtabea-shell-v1';
const APP_SHELL = ['./', './index.html'];

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => Promise.all(
            keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        ))
    );
    self.clients.claim();
});

// شبكة أولاً مع رجوع للتخزين المؤقت عند انقطاع الاتصال (لا نتدخل فى طلبات API)
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (event.request.url.indexOf('script.google.com') !== -1) return; // لا نخزّن استدعاءات الـ API مؤقتًا
    event.respondWith(
        fetch(event.request)
            .then((res) => {
                const resClone = res.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, resClone)).catch(() => {});
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});

/* ---------------------- إشعارات Push فى الخلفية (FCM) ---------------------- */
try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

    // ⚠️ يجب أن تطابق هذه القيم بالضبط إعدادات FIREBASE_CONFIG الموجودة فى index.html
    firebase.initializeApp({
        apiKey: "AIzaSyArZobSwV4zRzkkdqGeAiUb1JKjzabOXhM",
        authDomain: "mtab3a-1b478.firebaseapp.com",
        projectId: "mtab3a-1b478",
        storageBucket: "mtab3a-1b478.firebasestorage.app",
        messagingSenderId: "238806127152",
        appId: "1:238806127152:web:95ae2654807e0761c553f5",
    });

    const messaging = firebase.messaging();
    // مكتبة Firebase Messaging تتولى تلقائيًا عرض الإشعار عند وصوله والتطبيق مغلق/فى الخلفية
    messaging.onBackgroundMessage((payload) => {
        const n = payload.notification || {};
        self.registration.showNotification(n.title || 'متابعة المراكز', {
            body: n.body || '',
            icon: './icon.svg',
            badge: './icon.svg',
            dir: 'rtl',
            lang: 'ar'
        });
    });
} catch (e) {
    // لو لم يتم إعداد FCM بعد (القيم لا تزال YOUR_...) نتجاهل بصمت دون كسر الـ Service Worker
}

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        self.clients.matchAll({ type: 'window' }).then((clientsArr) => {
            const hadWindow = clientsArr.find((c) => 'focus' in c);
            if (hadWindow) return hadWindow.focus();
            if (self.clients.openWindow) return self.clients.openWindow('./');
        })
    );
});
