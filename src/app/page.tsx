'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, ShieldCheck, KeyRound, ArrowRight, BookOpen, AlertCircle, Loader2, Smartphone, Sparkles, ZoomIn, ZoomOut, ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function StudentHomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'scan' | 'manual'>('scan');
  const [hasToken, setHasToken] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [scanError, setScanError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [zoomRange, setZoomRange] = useState({ min: 1, max: 3.5, step: 0.25 });
  const [isHardwareZoom, setIsHardwareZoom] = useState(false);
  const [showZoomControls, setShowZoomControls] = useState(false);
  const scannerRef = useRef<any>(null);
  const touchStartDist = useRef<number | null>(null);
  const touchStartZoom = useRef<number>(1);

  useEffect(() => {
    const token = localStorage.getItem('creativa_device_token');
    setHasToken(!!token);
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = manualCode.trim();
    if (!clean) return;
    setIsSubmitting(true);
    if (clean.startsWith('http')) {
      try {
        const url = new URL(clean);
        router.push(url.pathname + url.search);
      } catch {
        router.push(`/checkin?t=${encodeURIComponent(clean)}`);
      }
    } else {
      router.push(`/checkin?t=${encodeURIComponent(clean)}`);
    }
  };

  const handleZoomChange = async (newZoom: number) => {
    const clamped = Math.min(Math.max(newZoom, zoomRange.min), zoomRange.max);
    const rounded = Math.round(clamped * 10) / 10;
    setZoomLevel(rounded);

    let hardwareApplied = false;
    if (scannerRef.current && isHardwareZoom) {
      try {
        const capabilities = scannerRef.current.getRunningTrackCameraCapabilities();
        const zoomFeature = capabilities?.zoomFeature?.();
        if (zoomFeature && zoomFeature.isSupported()) {
          await zoomFeature.apply(rounded);
          hardwareApplied = true;
        }
      } catch (e) {
        console.warn('Hardware zoom failed, falling back to CSS zoom', e);
      }
    }

    // Apply digital CSS scale if hardware zoom was not applied
    const video = document.querySelector('#qr-reader video') as HTMLVideoElement | null;
    if (video) {
      if (hardwareApplied) {
        video.style.transform = 'none';
      } else {
        video.style.transform = `scale(${rounded})`;
        video.style.transformOrigin = 'center center';
        video.style.transition = 'transform 0.15s ease-out';
      }
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      touchStartDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartZoom.current = zoomLevel;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current !== null) {
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = currentDist / touchStartDist.current;
      const targetZoom = touchStartZoom.current * factor;
      handleZoomChange(parseFloat(targetZoom.toFixed(1)));
    }
  };

  const handleTouchEnd = () => {
    touchStartDist.current = null;
  };

  useEffect(() => {
    let html5QrCode: any = null;

    if (activeTab === 'scan') {
      import('html5-qrcode')
        .then(({ Html5Qrcode }) => {
          html5QrCode = new Html5Qrcode('qr-reader');
          scannerRef.current = html5QrCode;

          const config = {
            fps: 15,
            qrbox: { width: 230, height: 230 },
            aspectRatio: 1.0,
          };

          html5QrCode
            .start(
              { facingMode: 'environment' },
              config,
              (decodedText: string) => {
                html5QrCode.stop().catch(() => {});
                try {
                  const url = new URL(decodedText);
                  router.push(url.pathname + url.search);
                } catch {
                  router.push(`/checkin?t=${encodeURIComponent(decodedText)}`);
                }
              },
              () => {}
            )
            .then(() => {
              setIsScanning(true);
              setScanError('');
              // Detect hardware camera zoom capabilities
              try {
                const capabilities = html5QrCode.getRunningTrackCameraCapabilities();
                const zoomFeature = capabilities?.zoomFeature?.();
                if (zoomFeature && zoomFeature.isSupported()) {
                  setIsHardwareZoom(true);
                  const min = zoomFeature.min() || 1;
                  const max = zoomFeature.max() || 5;
                  const step = zoomFeature.step() || 0.1;
                  setZoomRange({ min, max, step });
                  setZoomLevel(zoomFeature.value() || 1);
                } else {
                  setIsHardwareZoom(false);
                  setZoomRange({ min: 1, max: 3.5, step: 0.25 });
                  setZoomLevel(1);
                }
              } catch {
                setIsHardwareZoom(false);
                setZoomRange({ min: 1, max: 3.5, step: 0.25 });
                setZoomLevel(1);
              }
            })
            .catch((err: any) => {
              console.warn('Camera start error:', err);
              setScanError('Camera access required. Please allow camera permissions or enter the session code manually.');
            });
        })
        .catch(() => {
          setScanError('Scanner initialization failed. Please use manual session passcode.');
        });
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
      setZoomLevel(1);
    };
  }, [activeTab, router]);

  return (
    <div className="min-h-[100dvh] subtle-mesh flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#004e9e] selection:text-white">
      {/* Top Floating Brand Header with Glass Blur */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between px-4 py-2.5 bg-white/80 backdrop-blur-md border border-[#e5e5e5] rounded-full shadow-[0_4px_20px_-4px_rgba(0,78,158,0.06)]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white p-1 flex items-center justify-center border border-[#e5e5e5] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]">
            <Image src="/logo.png" alt="Creativa Hub Logo" width={28} height={28} className="object-contain" priority />
          </div>
          <div>
            <span className="font-extrabold text-xs sm:text-sm tracking-tight text-[#222222] block leading-tight">
              Creativa Hub
            </span>
            <span className="text-[10px] font-medium text-[#9e9e9e] block">Aswan Attendance Portal</span>
          </div>
        </div>

        {hasToken ? (
          <Badge variant="success">
            <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" /> Pass Active
          </Badge>
        ) : (
          <Badge variant="secondary">
            First Session
          </Badge>
        )}
      </header>

      {/* Main Interactive Check-in Card with Ambient Glow */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="relative">
          {/* Subtle Ambient Radial Glow Backdrops */}
          <div className="absolute -inset-2 sm:-inset-4 rounded-[2.5rem] bg-gradient-to-b from-[#004e9e]/15 via-[#f8af43]/10 to-transparent blur-2xl -z-10 pointer-events-none" />

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border border-[#e5e5e5] bg-white shadow-[0_12px_40px_-8px_rgba(0,78,158,0.08),0_2px_6px_rgba(0,0,0,0.02)] overflow-hidden">
              <CardContent className="p-6 sm:p-8">
                {/* Header Title with Badge */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6eff8] text-[#004e9e] text-[10px] font-bold border border-[#bfdbfe] shadow-[0_0_12px_rgba(0,78,158,0.15)] mb-3">
                    <Sparkles className="w-3 h-3 text-[#f8af43]" /> Live Room Verification
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#222222]">
                    Student Check-in
                  </h1>
                  <p className="text-xs text-[#616161] mt-1.5 max-w-xs mx-auto leading-relaxed">
                    Point your camera at the room session QR code displayed on screen to log your attendance.
                  </p>
                </div>

                {/* Pill Tabs Switcher */}
                <Tabs
                  value={activeTab}
                  onValueChange={(v) => setActiveTab(v as any)}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 mb-6 h-12 p-1 bg-[#fafafa] border border-[#e5e5e5]">
                    <TabsTrigger value="scan" className="gap-2 h-10 text-xs font-bold">
                      <Camera className="w-3.5 h-3.5" /> Camera Scanner
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="gap-2 h-10 text-xs font-bold">
                      <KeyRound className="w-3.5 h-3.5" /> Session Code
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: Live QR Scanner with Glow Target */}
                  <TabsContent value="scan" className="m-0 focus-visible:outline-none">
                    <div
                      onTouchStart={handleTouchStart}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={handleTouchEnd}
                      className="relative rounded-2xl overflow-hidden bg-[#001733] aspect-square max-w-[280px] mx-auto flex items-center justify-center border-2 border-[#002d5c] shadow-[0_8px_30px_rgba(0,23,51,0.4)] touch-none select-none"
                    >
                      <div id="qr-reader" className="w-full h-full overflow-hidden flex items-center justify-center" />

                      {/* Floating Zoom Indicator Badge */}
                      {isScanning && zoomLevel > 1 && (
                        <button
                          type="button"
                          onClick={() => setShowZoomControls(true)}
                          className="absolute top-2.5 right-2.5 z-20 bg-black/70 backdrop-blur-md text-white text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border border-white/20 shadow-md flex items-center gap-1 hover:bg-black/85 transition-colors cursor-pointer"
                        >
                          <ZoomIn className="w-2.5 h-2.5 text-[#f8af43]" />
                          {zoomLevel.toFixed(1)}x
                        </button>
                      )}

                      {/* High-Tech Glowing Viewfinder Target */}
                      {isScanning && (
                        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                          <div className="w-48 h-48 border-2 border-[#004e9e]/90 rounded-2xl relative shadow-[0_0_24px_rgba(0,78,158,0.5)]">
                            {/* Glowing Corner Accents */}
                            <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-white rounded-tl shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-white rounded-tr shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-white rounded-bl shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                            <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-white rounded-br shadow-[0_0_8px_rgba(255,255,255,0.8)]" />

                            {/* Gold Pulsing Laser Guide */}
                            <motion.div
                              className="w-full h-0.5 bg-[#f8af43] glow-laser"
                              animate={{ y: [0, 180, 0] }}
                              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                            />
                          </div>
                        </div>
                      )}

                      {!isScanning && !scanError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#001733] text-white p-4 text-center">
                          <Loader2 className="w-7 h-7 animate-spin text-[#f8af43] mb-2.5" />
                          <span className="text-xs font-semibold tracking-wide">Initializing camera...</span>
                        </div>
                      )}

                      {scanError && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#001733] p-5 text-center">
                          <AlertCircle className="w-7 h-7 text-[#f8af43] mb-2" />
                          <p className="text-[11px] text-white/80 leading-relaxed mb-3.5">{scanError}</p>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setActiveTab('manual')}
                            className="font-bold shadow-md"
                          >
                            Enter Code Manually
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Camera Zoom Distance Controls (Hidden until student clicks) */}
                    {isScanning && (
                      <div className="mt-3 flex flex-col items-center">
                        <button
                          type="button"
                          onClick={() => setShowZoomControls((prev) => !prev)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all border shadow-xs ${
                            showZoomControls || zoomLevel > 1
                              ? 'bg-[#e6eff8] text-[#004e9e] border-[#bfdbfe]'
                              : 'bg-white text-[#616161] hover:text-[#222222] border-[#e5e5e5] hover:bg-[#fafafa]'
                          }`}
                        >
                          <ZoomIn className="w-3.5 h-3.5 text-[#004e9e]" />
                          <span>
                            {zoomLevel > 1
                              ? `Zoom: ${zoomLevel.toFixed(1)}x`
                              : 'Distance Zoom'}
                          </span>
                          {showZoomControls ? (
                            <ChevronUp className="w-3 h-3 text-[#004e9e]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[#9e9e9e]" />
                          )}
                        </button>

                        <AnimatePresence>
                          {showZoomControls && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.2, ease: 'easeInOut' }}
                              className="w-full max-w-[280px] overflow-hidden"
                            >
                              <div className="flex flex-col items-center gap-2 p-3 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
                                <div className="flex items-center justify-between w-full px-1">
                                  <span className="text-[10px] font-bold text-[#616161] uppercase tracking-wider flex items-center gap-1">
                                    <SlidersHorizontal className="w-3 h-3 text-[#004e9e]" /> Adjust Zoom
                                  </span>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-mono font-bold text-[#004e9e] bg-[#e6eff8] px-2 py-0.5 rounded-full border border-[#bfdbfe]">
                                      {zoomLevel.toFixed(1)}x {isHardwareZoom ? '• Camera' : ''}
                                    </span>
                                    {zoomLevel > 1 && (
                                      <button
                                        type="button"
                                        onClick={() => handleZoomChange(1)}
                                        className="text-[10px] text-[#9e9e9e] hover:text-[#b91c1c] underline transition-colors"
                                      >
                                        Reset
                                      </button>
                                    )}
                                  </div>
                                </div>

                                {/* Quick Preset Buttons */}
                                <div className="flex items-center gap-1 p-1 bg-[#fafafa] border border-[#e5e5e5] rounded-full shadow-xs w-full justify-between">
                                  {[1, 1.5, 2, 2.5, 3].map((z) => {
                                    const isSelected = Math.abs(zoomLevel - z) < 0.15;
                                    return (
                                      <button
                                        key={z}
                                        type="button"
                                        onClick={() => handleZoomChange(z)}
                                        className={`flex-1 py-1 rounded-full text-xs font-mono font-bold transition-all ${
                                          isSelected
                                            ? 'bg-[#004e9e] text-white shadow-xs'
                                            : 'text-[#616161] hover:text-[#222222] hover:bg-white'
                                        }`}
                                      >
                                        {z}x
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Fine-tune Slider with - / + */}
                                <div className="flex items-center gap-2 w-full px-1">
                                  <button
                                    type="button"
                                    onClick={() => handleZoomChange(Math.max(zoomRange.min, zoomLevel - 0.25))}
                                    className="p-1 rounded-full text-[#616161] hover:text-[#004e9e] hover:bg-[#fafafa] transition-colors"
                                    title="Zoom out"
                                  >
                                    <ZoomOut className="w-3.5 h-3.5" />
                                  </button>
                                  <input
                                    type="range"
                                    min={zoomRange.min}
                                    max={zoomRange.max}
                                    step={zoomRange.step}
                                    value={zoomLevel}
                                    onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-[#e5e5e5] rounded-lg appearance-none cursor-pointer accent-[#004e9e]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleZoomChange(Math.min(zoomRange.max, zoomLevel + 0.25))}
                                    className="p-1 rounded-full text-[#616161] hover:text-[#004e9e] hover:bg-[#fafafa] transition-colors"
                                    title="Zoom in"
                                  >
                                    <ZoomIn className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    <p className="text-[11px] text-center text-[#9e9e9e] mt-3 font-medium">
                      Align the room QR code inside the frame for instant recording
                    </p>
                  </TabsContent>

                  {/* Tab 2: Manual Passcode Entry */}
                  <TabsContent value="manual" className="m-0 focus-visible:outline-none">
                    <form onSubmit={handleManualSubmit} className="space-y-4 py-2">
                      <div>
                        <label className="block text-xs font-bold text-[#222222] mb-1.5">
                          Session Passcode / Direct URL
                        </label>
                        <Input
                          type="text"
                          value={manualCode}
                          onChange={(e) => setManualCode(e.target.value)}
                          placeholder="Paste signed code or room token"
                          className="font-mono text-center tracking-wider text-xs h-12"
                          autoFocus
                        />
                      </div>

                      <Button
                        type="submit"
                        variant="primary"
                        className="w-full h-12 text-sm font-bold"
                        disabled={!manualCode.trim() || isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Verifying Passcode...
                          </>
                        ) : (
                          <>
                            Verify Attendance <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Navigation Options */}
                <div className="mt-7 pt-6 border-t border-[#e5e5e5] flex flex-col gap-2.5">
                  <Link
                    href="/my-courses"
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-[#fafafa] hover:bg-[#e6eff8]/70 border border-[#e5e5e5] hover:border-[#bfdbfe] hover:shadow-[0_4px_16px_rgba(0,78,158,0.08)] transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white border border-[#e5e5e5] flex items-center justify-center text-[#004e9e] group-hover:border-[#004e9e] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#222222] group-hover:text-[#004e9e] block leading-tight">
                          My Courses &amp; Attendance
                        </span>
                        <span className="text-[10px] text-[#9e9e9e]">View recorded sessions &amp; certificate status</span>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#9e9e9e] group-hover:text-[#004e9e] transition-transform group-hover:translate-x-1" />
                  </Link>

                  <div className="flex items-center justify-between text-[11px] px-2 text-[#9e9e9e] mt-1">
                    <Link href="/relink" className="hover:text-[#004e9e] transition-colors font-medium flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> Re-link device pass
                    </Link>
                    <Link href="/admin/login" className="hover:text-[#004e9e] transition-colors font-medium">
                      Coordinator login &rarr;
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-[11px] text-[#9e9e9e] font-medium tracking-wide">
        Creativa Aswan Team
      </footer>
    </div>
  );
}