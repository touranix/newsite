import { useState, useRef, useEffect } from 'react';
import { Upload, Download, Type, Settings, RotateCcw, Palette, Move, Sliders, Eye, EyeOff, Image as ImageIcon, Grid3X3, Crown, Star, Copy } from './components/ui/simple-icons';
import { Button } from './components/ui/simple-button';
import { Card } from './components/ui/simple-card';
import { Input } from './components/ui/simple-input';
import { Textarea } from './components/ui/simple-textarea';

// Логотип AWiT
const AWiTLogo = () => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-sm">AWiT</span>
      </div>
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 blur-md opacity-50"></div>
    </div>
    <div className="text-2xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
      AWiT
    </div>
  </div>
);

interface WatermarkSettings {
  type: 'text' | 'image';
  text: string;
  imageFile: File | null;
  imageUrl: string | null;
  fontSize: number;
  color: string;
  opacity: number;
  position: {
    x: number;
    y: number;
  };
  rotation: number;
  fontFamily: string;
  fontWeight: string;
  textAlign: string;
  strokeColor: string;
  strokeWidth: number;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  // Pattern settings
  pattern: boolean;
  patternSpacing: number;
  patternRows: number;
  patternCols: number;
  // Image watermark settings
  imageSize: number;
}

interface Subscription {
  isPro: boolean;
  expiresAt: Date | null;
}

const WATERMARK_POSITIONS = {
  'top-left': { x: 5, y: 10 },
  'top-center': { x: 50, y: 10 },
  'top-right': { x: 95, y: 10 },
  'center-left': { x: 5, y: 50 },
  'center': { x: 50, y: 50 },
  'center-right': { x: 95, y: 50 },
  'bottom-left': { x: 5, y: 90 },
  'bottom-center': { x: 50, y: 90 },
  'bottom-right': { x: 95, y: 90 }
};

const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Georgia, serif',
  'Times New Roman, serif',
  'Courier New, monospace',
  'Verdana, sans-serif',
  'Helvetica, sans-serif',
  'Impact, sans-serif'
];

const PRESET_COLORS = [
  '#FFFFFF', '#000000', '#FF0000', '#00FF00', '#0000FF',
  '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080'
];

const SUBSCRIPTION_PLANS = [
  {
    id: 'pro_monthly',
    name: 'Pro Месячная',
    price: 299,
    duration: 30,
    features: [
      'Убрать водяной знак AWiT',
      'Неограниченные загрузки',
      'Приоритетная поддержка',
      'Расширенные настройки'
    ]
  },
  {
    id: 'pro_yearly',
    name: 'Pro Годовая',
    price: 1999,
    duration: 365,
    features: [
      'Убрать водяной знак AWiT',
      'Неограниченные загрузки',
      'Приоритетная поддержка',
      'Расширенные настройки',
      'Скидка 44%'
    ],
    popular: true
  }
];

export default function App() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<HTMLImageElement | null>(null);
  const [watermarkImageElement, setWatermarkImageElement] = useState<HTMLImageElement | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewMode, setPreviewMode] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const watermarkImageInputRef = useRef<HTMLInputElement>(null);

  const [subscription, setSubscription] = useState<Subscription>({
    isPro: false,
    expiresAt: null
  });

  const [watermark, setWatermark] = useState<WatermarkSettings>({
    type: 'text',
    text: 'Sample Watermark',
    imageFile: null,
    imageUrl: null,
    fontSize: 48,
    color: '#FFFFFF',
    opacity: 0.7,
    position: { x: 95, y: 90 },
    rotation: 0,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'bold',
    textAlign: 'right',
    strokeColor: '#000000',
    strokeWidth: 0,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    pattern: false,
    patternSpacing: 150,
    patternRows: 3,
    patternCols: 3,
    imageSize: 100
  });

  const [imageInfo, setImageInfo] = useState<{
    width: number;
    height: number;
    size: string;
  } | null>(null);

  // Безопасная загрузка изображения водяного знака
  useEffect(() => {
    if (watermark.imageUrl) {
      const img = new Image();
      img.onload = () => {
        try {
          setWatermarkImageElement(img);
        } catch (error) {
          console.error('Ошибка при загрузке водяного знака:', error);
          setError('Ошибка загрузки изображения водяного знака');
          setWatermarkImageElement(null);
        }
      };
      img.onerror = () => {
        console.error('Не удалось загрузить изображение водяного знака');
        setError('Поврежденное изображение водяного знака');
        setWatermarkImageElement(null);
      };
      img.src = watermark.imageUrl;
    } else {
      setWatermarkImageElement(null);
    }
  }, [watermark.imageUrl]);

  useEffect(() => {
    if (selectedImage && originalImage) {
      try {
        drawWatermark();
      } catch (error) {
        console.error('Ошибка при рендеринге:', error);
        setError('Ошибка при обработке изображения');
      }
    }
  }, [watermark, selectedImage, originalImage, previewMode, subscription, watermarkImageElement]);

  const validateFile = (file: File, maxSize: number, allowedTypes: string[]): boolean => {
    if (file.size > maxSize) {
      setError(`Размер файла не должен превышать ${Math.round(maxSize / (1024 * 1024))}MB`);
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      setError('Неподдерживаемый формат файла');
      return false;
    }

    return true;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoadingImage(true);

    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validateFile(file, 10 * 1024 * 1024, allowedTypes)) {
        setIsLoadingImage(false);
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const imageUrl = e.target?.result as string;
          if (!imageUrl) {
            throw new Error('Не удалось прочитать файл');
          }

          setSelectedImage(imageUrl);
          
          const img = new Image();
          img.onload = () => {
            try {
              // Проверяем размеры изображения
              if (img.width > 10000 || img.height > 10000) {
                setError('Изображение слишком большое (максимум 10000x10000 пикселей)');
                setIsLoadingImage(false);
                return;
              }

              if (img.width < 10 || img.height < 10) {
                setError('Изображение слишком маленькое (минимум 10x10 пикселей)');
                setIsLoadingImage(false);
                return;
              }

              setOriginalImage(img);
              setImageInfo({
                width: img.width,
                height: img.height,
                size: formatFileSize(file.size)
              });
              setIsLoadingImage(false);
            } catch (error) {
              console.error('Ошибка при обработке изображения:', error);
              setError('Ошибка при обработке изображения');
              setIsLoadingImage(false);
            }
          };

          img.onerror = () => {
            setError('Поврежденное или неподдерживаемое изображение');
            setIsLoadingImage(false);
          };

          img.src = imageUrl;
        } catch (error) {
          console.error('Ошибка при чтении файла:', error);
          setError('Ошибка при чтении файла');
          setIsLoadingImage(false);
        }
      };

      reader.onerror = () => {
        setError('Ошибка при чтении файла');
        setIsLoadingImage(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Общая ошибка при загрузке:', error);
      setError('Неожиданная ошибка при загрузке файла');
      setIsLoadingImage(false);
    }

    // Сбрасываем input для возможности повторной загрузки того же файла
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleWatermarkImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validateFile(file, 5 * 1024 * 1024, allowedTypes)) {
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const imageUrl = e.target?.result as string;
          if (!imageUrl) {
            throw new Error('Не удалось прочитать файл водяного знака');
          }

          setWatermark(prev => ({
            ...prev,
            imageFile: file,
            imageUrl: imageUrl
          }));
        } catch (error) {
          console.error('Ошибка при обработке водяного знака:', error);
          setError('Ошибка при обработке изображения водяного знака');
        }
      };

      reader.onerror = () => {
        setError('Ошибка при чтении файла водяного знака');
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка при загрузке водяного знака:', error);
      setError('Неожиданная ошибка при загрузке водяного знака');
    }

    if (event.target) {
      event.target.value = '';
    }
  };

  const drawWatermark = () => {
    if (!originalImage || !canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Не удалось получить контекст Canvas');
      }

      canvas.width = originalImage.width;
      canvas.height = originalImage.height;

      // Очищаем canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Рисуем оригинальное изображение
      ctx.drawImage(originalImage, 0, 0);

      // Рисуем водяные знаки только если включен предварительный просмотр
      if (previewMode) {
        // Рисуем основной водяной знак
        if (watermark.pattern) {
          drawPatternWatermark(ctx, canvas.width, canvas.height);
        } else {
          drawSingleWatermark(ctx, canvas.width, canvas.height);
        }

        // Рисуем обязательный брендинг AWiT (если не Pro подписка)
        if (!subscription.isPro) {
          drawBrandingWatermark(ctx, canvas.width, canvas.height);
        }
      }
    } catch (error) {
      console.error('Ошибка при рисовании водяного знака:', error);
      setError('Ошибка при применении водяного знака');
    }
  };

  const drawSingleWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      ctx.save();

      const x = (watermark.position.x / 100) * width;
      const y = (watermark.position.y / 100) * height;

      ctx.translate(x, y);
      ctx.rotate((watermark.rotation * Math.PI) / 180);

      if (watermark.type === 'text') {
        drawTextWatermark(ctx);
      } else if (watermark.type === 'image' && watermarkImageElement) {
        drawImageWatermark(ctx, watermarkImageElement);
      }

      ctx.restore();
    } catch (error) {
      console.error('Ошибка при рисовании одиночного водяного знака:', error);
      ctx.restore();
    }
  };

  const drawPatternWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      const spacing = watermark.patternSpacing;
      const cols = Math.max(2, Math.ceil(width / spacing));
      const rows = Math.max(2, Math.ceil(height / spacing));

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.save();

          const x = (col * spacing) + (spacing / 2);
          const y = (row * spacing) + (spacing / 2);

          // Добавляем небольшое смещение для шахматного узора
          const offsetX = (row % 2) * (spacing / 4);
          const offsetY = (col % 2) * (spacing / 4);

          ctx.translate(x + offsetX, y + offsetY);
          ctx.rotate((watermark.rotation * Math.PI) / 180);

          // Уменьшаем прозрачность для паттерна
          const patternOpacity = watermark.opacity * 0.6;

          if (watermark.type === 'text') {
            ctx.globalAlpha = patternOpacity;
            drawTextWatermark(ctx);
          } else if (watermark.type === 'image' && watermarkImageElement) {
            ctx.globalAlpha = patternOpacity;
            drawImageWatermark(ctx, watermarkImageElement);
          }

          ctx.restore();
        }
      }
    } catch (error) {
      console.error('Ошибка при рисовании паттерна:', error);
    }
  };

  const drawTextWatermark = (ctx: CanvasRenderingContext2D) => {
    try {
      ctx.font = `${watermark.fontWeight} ${watermark.fontSize}px ${watermark.fontFamily}`;
      ctx.textAlign = watermark.textAlign as CanvasTextAlign;
      ctx.textBaseline = 'middle';

      if (watermark.shadowBlur > 0) {
        ctx.shadowColor = watermark.shadowColor;
        ctx.shadowBlur = watermark.shadowBlur;
        ctx.shadowOffsetX = watermark.shadowOffsetX;
        ctx.shadowOffsetY = watermark.shadowOffsetY;
      }

      if (watermark.strokeWidth > 0) {
        ctx.strokeStyle = watermark.strokeColor;
        ctx.lineWidth = watermark.strokeWidth;
        ctx.globalAlpha = watermark.opacity;
        ctx.strokeText(watermark.text, 0, 0);
      }

      ctx.fillStyle = watermark.color;
      ctx.globalAlpha = watermark.opacity;
      ctx.fillText(watermark.text, 0, 0);
    } catch (error) {
      console.error('Ошибка при рисовании текста:', error);
    }
  };

  const drawImageWatermark = (ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    try {
      const size = watermark.imageSize;
      ctx.globalAlpha = watermark.opacity;
      ctx.drawImage(img, -size/2, -size/2, size, size);
    } catch (error) {
      console.error('Ошибка при рисовании изображения:', error);
    }
  };

  const drawBrandingWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    try {
      ctx.save();

      // Позиционируем брендинг в правом нижнем углу
      const x = width - 10;
      const y = height - 10;

      ctx.translate(x, y);
      ctx.font = 'normal 12px Arial, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';
      ctx.fillStyle = '#666666';
      ctx.globalAlpha = 0.8;
      ctx.fillText('AWiT', 0, 0);

      ctx.restore();
    } catch (error) {
      console.error('Ошибка при рисовании брендинга:', error);
      ctx.restore();
    }
  };

  const handleDownload = async () => {
    if (!canvasRef.current || !originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Включаем предварительный просмотр для финального рендера
      const wasPreviewMode = previewMode;
      if (!previewMode) {
        setPreviewMode(true);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      const canvas = canvasRef.current;
      const link = document.createElement('a');
      
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `awit_watermarked_${timestamp}.png`;
      
      link.download = filename;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();

      // Возвращаем предыдущий режим предварительного просмотра
      if (!wasPreviewMode) {
        setPreviewMode(false);
      }

      setTimeout(() => {
        alert('Изображение успешно сохранено!');
      }, 500);

    } catch (error) {
      console.error('Ошибка при сохранении:', error);
      setError('Произошла ошибка при сохранении изображения');
    }

    setIsProcessing(false);
  };

  const handleSubscribe = (planId: string) => {
    // Симуляция покупки подписки
    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (plan) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + plan.duration);
      
      setSubscription({
        isPro: true,
        expiresAt: expiresAt
      });
      
      setShowSubscription(false);
      alert(`Подписка "${plan.name}" успешно активирована!\nДействует до: ${expiresAt.toLocaleDateString('ru-RU')}`);
    }
  };

  const resetSettings = () => {
    setWatermark({
      type: 'text',
      text: 'Sample Watermark',
      imageFile: null,
      imageUrl: null,
      fontSize: 48,
      color: '#FFFFFF',
      opacity: 0.7,
      position: { x: 95, y: 90 },
      rotation: 0,
      fontFamily: 'Arial, sans-serif',
      fontWeight: 'bold',
      textAlign: 'right',
      strokeColor: '#000000',
      strokeWidth: 0,
      shadowColor: '#000000',
      shadowBlur: 0,
      shadowOffsetX: 0,
      shadowOffsetY: 0,
      pattern: false,
      patternSpacing: 150,
      patternRows: 3,
      patternCols: 3,
      imageSize: 100
    });
    setError(null);
  };

  const setPresetPosition = (positionKey: keyof typeof WATERMARK_POSITIONS) => {
    const position = WATERMARK_POSITIONS[positionKey];
    setWatermark(prev => ({
      ...prev,
      position,
      textAlign: positionKey.includes('right') ? 'right' : 
                positionKey.includes('center') ? 'center' : 'left'
    }));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isCanvasSupported = () => {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch (e) {
      return false;
    }
  };

  if (!isCanvasSupported()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Card className="bg-gray-900 border-gray-800 p-8 text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-4">Браузер не поддерживается</h2>
          <p className="text-gray-400 mb-4">
            Ваш браузер не поддерживает Canvas API, необходимый для работы приложения.
          </p>
          <p className="text-gray-500 text-sm">
            Попробуйте обновить браузер или используйте современный браузер.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <AWiTLogo />
          <div className="flex items-center gap-2">
            {subscription.isPro && (
              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-sm">
                <Crown size={14} />
                Pro
              </div>
            )}
            <Button
              onClick={() => setShowSubscription(true)}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-purple-500 text-purple-400 hover:bg-purple-500/20"
            >
              <Star size={16} />
              <span className="ml-2 hidden sm:inline">Pro</span>
            </Button>
            <Button
              onClick={() => setPreviewMode(!previewMode)}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
            >
              {previewMode ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="ml-2 hidden sm:inline">
                {previewMode ? 'Скрыть' : 'Показать'}
              </span>
            </Button>
            <Button
              onClick={() => setShowSettings(!showSettings)}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 sm:hidden"
            >
              <Settings size={16} />
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        {/* Main Canvas Area */}
        <div className="flex-1 p-4 lg:p-6">
          <div className="h-full">
            {!selectedImage ? (
              <Card className="bg-gray-900 border-gray-800 border-dashed border-2 p-12 text-center h-full flex flex-col items-center justify-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {isLoadingImage ? (
                  <>
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h2 className="text-2xl font-bold text-white mb-4">Загрузка изображения...</h2>
                    <p className="text-gray-400">Обработка файла, пожалуйста подождите</p>
                  </>
                ) : (
                  <>
                    <div className="text-8xl mb-6">📸</div>
                    <h2 className="text-2xl font-bold text-white mb-4">Загрузите изображение</h2>
                    <p className="text-gray-400 mb-6 max-w-md">
                      Поддерживаются форматы JPEG, PNG, GIF, WebP до 10MB
                    </p>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                      size="lg"
                    >
                      <Upload size={20} className="mr-2" />
                      Выбрать файл
                    </Button>
                    <p className="text-gray-500 text-sm mt-4">
                      Или перетащите файл в эту область
                    </p>
                  </>
                )}
              </Card>
            ) : (
              <div className="h-full flex flex-col space-y-4">
                {/* Error Display */}
                {error && (
                  <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <div className="text-red-400">⚠️</div>
                      <p className="text-red-300 text-sm">{error}</p>
                      <Button
                        onClick={() => setError(null)}
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-red-400 hover:text-red-300"
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                )}

                {imageInfo && (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                    <span>Размер: {imageInfo.width} × {imageInfo.height}</span>
                    <span>Файл: {imageInfo.size}</span>
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      variant="outline"
                      size="sm"
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 ml-auto"
                    >
                      <Upload size={14} className="mr-1" />
                      Другое фото
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                )}

                {/* Full Screen Canvas Container */}
                <div className="flex-1 bg-gray-900 border border-gray-800 rounded-lg p-4 min-h-0">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <canvas
                      ref={canvasRef}
                      className="max-w-full max-h-full border border-gray-700 rounded shadow-2xl"
                      style={{ 
                        display: 'block',
                        objectFit: 'contain'
                      }}
                    />
                    {!subscription.isPro && (
                      <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-black/50 px-2 py-1 rounded">
                        AWiT - Убрать в Pro
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={handleDownload}
                    disabled={isProcessing}
                    className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Обработка...
                      </>
                    ) : (
                      <>
                        <Download size={16} className="mr-2" />
                        Скачать
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={resetSettings}
                    variant="outline"
                    className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                  >
                    <RotateCcw size={16} className="mr-2" />
                    Сбросить
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {selectedImage && (
          <div className={`w-full lg:w-80 xl:w-96 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-800 transition-all duration-300 ${
            showSettings ? 'block' : 'hidden lg:block'
          }`}>
            <div className="p-4 lg:p-6 space-y-6 max-h-[calc(100vh-80px)] overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Настройки водяного знака</h3>
                <Button
                  onClick={() => setShowSettings(false)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white lg:hidden"
                >
                  ×
                </Button>
              </div>

              {/* Watermark Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Тип водяного знака
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWatermark(prev => ({ ...prev, type: 'text' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      watermark.type === 'text'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-300'
                    }`}
                  >
                    <Type size={16} />
                    Текст
                  </button>
                  <button
                    onClick={() => setWatermark(prev => ({ ...prev, type: 'image' }))}
                    className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                      watermark.type === 'image'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-300'
                    }`}
                  >
                    <ImageIcon size={16} />
                    Фото
                  </button>
                </div>
              </div>

              {/* Pattern Mode */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={watermark.pattern}
                    onChange={(e) => setWatermark(prev => ({ ...prev, pattern: e.target.checked }))}
                    className="rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-300">Паттерн (множественные водяные знаки)</span>
                  <Grid3X3 size={16} className="text-gray-400" />
                </label>
              </div>

              {watermark.pattern && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Расстояние между элементами
                  </label>
                  <Input
                    type="number"
                    min="50"
                    max="300"
                    value={watermark.patternSpacing}
                    onChange={(e) => setWatermark(prev => ({ ...prev, patternSpacing: Number(e.target.value) }))}
                    className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                  />
                </div>
              )}

              {/* Text Watermark Settings */}
              {watermark.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Текст водяного знака
                  </label>
                  <Textarea
                    value={watermark.text}
                    onChange={(e) => setWatermark(prev => ({ ...prev, text: e.target.value }))}
                    placeholder="Введите текст..."
                    className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white resize-none"
                    rows={3}
                  />
                </div>
              )}

              {/* Image Watermark Settings */}
              {watermark.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Изображение водяного знака
                  </label>
                  <div className="space-y-3">
                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center hover:border-gray-500 transition-colors">
                      <input
                        ref={watermarkImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleWatermarkImageUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => watermarkImageInputRef.current?.click()}
                        className="w-full"
                      >
                        {watermark.imageUrl ? (
                          <div className="space-y-2">
                            <img
                              src={watermark.imageUrl}
                              alt="Watermark"
                              className="w-16 h-16 object-cover rounded mx-auto"
                            />
                            <p className="text-sm text-gray-300">Изображение загружено</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="text-2xl">🖼️</div>
                            <p className="text-sm text-gray-300">Выберите изображение</p>
                            <p className="text-xs text-gray-500">PNG, JPG до 5MB</p>
                          </div>
                        )}
                      </button>
                    </div>
                    
                    {watermark.imageUrl && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Размер изображения
                        </label>
                        <Input
                          type="number"
                          min="20"
                          max="500"
                          value={watermark.imageSize}
                          onChange={(e) => setWatermark(prev => ({ ...prev, imageSize: Number(e.target.value) }))}
                          className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quick Position */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Быстрое позиционирование
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(WATERMARK_POSITIONS).map(([key, position]) => (
                    <button
                      key={key}
                      onClick={() => setPresetPosition(key as keyof typeof WATERMARK_POSITIONS)}
                      className={`p-3 rounded-lg border-2 transition-all text-xs ${
                        watermark.position.x === position.x && watermark.position.y === position.y
                          ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                          : 'border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-300'
                      }`}
                    >
                      {key.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Position */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Позиция X (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={watermark.position.x}
                    onChange={(e) => setWatermark(prev => ({
                      ...prev,
                      position: { ...prev.position, x: Number(e.target.value) }
                    }))}
                    className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Позиция Y (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={watermark.position.y}
                    onChange={(e) => setWatermark(prev => ({
                      ...prev,
                      position: { ...prev.position, y: Number(e.target.value) }
                    }))}
                    className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                  />
                </div>
              </div>

              {/* Common Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {watermark.type === 'text' ? 'Размер шрифта' : 'Размер'}
                  </label>
                  <Input
                    type="number"
                    min="8"
                    max="200"
                    value={watermark.type === 'text' ? watermark.fontSize : watermark.imageSize}
                    onChange={(e) => setWatermark(prev => ({ 
                      ...prev, 
                      [watermark.type === 'text' ? 'fontSize' : 'imageSize']: Number(e.target.value) 
                    }))}
                    className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Поворот (°)
                  </label>
                  <Input
                    type="number"
                    min="-180"
                    max="180"
                    value={watermark.rotation}
                    onChange={(e) => setWatermark(prev => ({ ...prev, rotation: Number(e.target.value) }))}
                    className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                  />
                </div>
              </div>

              {/* Text-specific settings */}
              {watermark.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Шрифт
                    </label>
                    <select
                      value={watermark.fontFamily}
                      onChange={(e) => setWatermark(prev => ({ ...prev, fontFamily: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      {FONT_FAMILIES.map(font => (
                        <option key={font} value={font}>
                          {font.split(',')[0]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Начертание
                      </label>
                      <select
                        value={watermark.fontWeight}
                        onChange={(e) => setWatermark(prev => ({ ...prev, fontWeight: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="normal">Обычный</option>
                        <option value="bold">Жирный</option>
                        <option value="lighter">Тонкий</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Выравнивание
                      </label>
                      <select
                        value={watermark.textAlign}
                        onChange={(e) => setWatermark(prev => ({ ...prev, textAlign: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="left">Слева</option>
                        <option value="center">По центру</option>
                        <option value="right">Справа</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Цвет текста
                    </label>
                    <div className="grid grid-cols-5 gap-2 mb-3">
                      {PRESET_COLORS.map(color => (
                        <button
                          key={color}
                          onClick={() => setWatermark(prev => ({ ...prev, color }))}
                          className={`w-full h-10 rounded-lg border-2 transition-all ${
                            watermark.color === color
                              ? 'border-purple-500 scale-110'
                              : 'border-gray-600 hover:border-gray-500'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <Input
                      type="color"
                      value={watermark.color}
                      onChange={(e) => setWatermark(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full h-10 bg-gray-800 border-gray-700 focus:border-purple-500"
                    />
                  </div>
                </>
              )}

              {/* Opacity */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Прозрачность ({Math.round(watermark.opacity * 100)}%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={watermark.opacity}
                  onChange={(e) => setWatermark(prev => ({ ...prev, opacity: Number(e.target.value) }))}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #374151 0%, #A855F7 ${watermark.opacity * 100}%, #374151 ${watermark.opacity * 100}%)`
                  }}
                />
              </div>

              {/* Text-specific advanced settings */}
              {watermark.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Обводка текста
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Ширина</label>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={watermark.strokeWidth}
                          onChange={(e) => setWatermark(prev => ({ ...prev, strokeWidth: Number(e.target.value) }))}
                          className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Цвет</label>
                        <Input
                          type="color"
                          value={watermark.strokeColor}
                          onChange={(e) => setWatermark(prev => ({ ...prev, strokeColor: e.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Тень
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Размытие</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          value={watermark.shadowBlur}
                          onChange={(e) => setWatermark(prev => ({ ...prev, shadowBlur: Number(e.target.value) }))}
                          className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Цвет</label>
                        <Input
                          type="color"
                          value={watermark.shadowColor}
                          onChange={(e) => setWatermark(prev => ({ ...prev, shadowColor: e.target.value }))}
                          className="h-9 bg-gray-800 border-gray-700 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Смещение X</label>
                        <Input
                          type="number"
                          min="-50"
                          max="50"
                          value={watermark.shadowOffsetX}
                          onChange={(e) => setWatermark(prev => ({ ...prev, shadowOffsetX: Number(e.target.value) }))}
                          className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">Смещение Y</label>
                        <Input
                          type="number"
                          min="-50"
                          max="50"
                          value={watermark.shadowOffsetY}
                          onChange={(e) => setWatermark(prev => ({ ...prev, shadowOffsetY: Number(e.target.value) }))}
                          className="bg-gray-800 border-gray-700 focus:border-purple-500 text-white"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Subscription Modal */}
      {showSubscription && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl bg-gray-900 border-gray-800 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Crown size={32} className="text-yellow-400" />
                  <h2 className="text-3xl font-bold text-white">AWiT Pro</h2>
                </div>
                <p className="text-gray-400">
                  Уберите водяной знак AWiT и получите полный доступ ко всем функциям
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {SUBSCRIPTION_PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`relative p-6 rounded-xl border-2 transition-all ${
                      plan.popular
                        ? 'border-purple-500 bg-purple-500/10'
                        : 'border-gray-700 bg-gray-800/50'
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <div className="bg-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                          Популярный
                        </div>
                      </div>
                    )}
                    
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                      <div className="text-3xl font-bold text-purple-400 mb-1">
                        {plan.price}₽
                      </div>
                      <p className="text-gray-400 text-sm">
                        {plan.duration === 30 ? 'в месяц' : 'в год'}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      className={`w-full ${
                        plan.popular
                          ? 'bg-purple-600 hover:bg-purple-700'
                          : 'bg-gray-700 hover:bg-gray-600'
                      } text-white`}
                    >
                      <Crown size={16} className="mr-2" />
                      Оформить подписку
                    </Button>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={() => setShowSubscription(false)}
                  className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                >
                  Закрыть
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Mobile Settings Toggle */}
      {selectedImage && !showSettings && (
        <Button
          onClick={() => setShowSettings(true)}
          className="fixed bottom-4 right-4 z-50 bg-purple-600 hover:bg-purple-700 text-white rounded-full w-14 h-14 lg:hidden shadow-lg"
        >
          <Settings size={20} />
        </Button>
      )}
    </div>
  );
}
