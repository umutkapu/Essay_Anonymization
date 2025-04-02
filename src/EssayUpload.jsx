import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { Divider } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';

// Yardımcı fonksiyon: CSRF token'ı cookie'den al
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === `${name}=`) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const NAVIGATION = [
    { kind: 'header', title: 'Makale İşlemleri' },
    { segment: 'messages', title: 'Mesaj Gönderme', icon: <SendIcon /> },
    { segment: 'essay_upload', title: 'Makale Yükleme', icon: <CloudUploadIcon /> },
];

const demoTheme = extendTheme({
    colorSchemes: { light: true, dark: true },
    colorSchemeSelector: 'class',
    breakpoints: {
        values: { xs: 0, sm: 600, md: 600, lg: 1200, xl: 1536 },
    },
});

function useDemoRouter(initialPath) {
    const [pathname, setPathname] = React.useState(initialPath);
    return React.useMemo(() => ({
        pathname,
        searchParams: new URLSearchParams(),
        navigate: (path) => setPathname(String(path)),
    }), [pathname]);
}

export default function EssayUpload(props) {
    const { window } = props;
    const router = useDemoRouter('/makalesistemi');
    const demoWindow = window ? window() : undefined;

    const [message, setMessage] = React.useState('');
    const [email, setEmail] = React.useState('');
    const [emailError, setEmailError] = React.useState(false);
    const [emailHelperText, setEmailHelperText] = React.useState('');
    const [selectedFile, setSelectedFile] = React.useState(null);

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const handleEmailChange = (event) => {
        const value = event.target.value;
        setEmail(value);
        if (!value) {
            setEmailError(false);
            setEmailHelperText('');
        } else if (!validateEmail(value)) {
            setEmailError(true);
            setEmailHelperText('Geçersiz e-posta formatı');
        } else {
            setEmailError(false);
            setEmailHelperText('');
        }
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            console.log('Dosya seçildi:', file);
        }
    };

    const handleUpload = async () => {
        if (!email || emailError) {
            alert('Lütfen geçerli bir e-posta adresi girin.');
            return;
        }

        if (!selectedFile) {
            alert('Lütfen bir makale dosyası seçin.');
            return;
        }

        const formData = new FormData();
        formData.append('author_email', email);
        formData.append('file', selectedFile);

        const csrfToken = getCookie('csrftoken');

        try {
            const response = await fetch('http://localhost:8000/makale_sistemi/', {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                },
                credentials: 'include',
                body: formData,
            });

            const result = await response.json();  // 🔁 JSON yanıtını al

            if (response.ok && result.success) {
                alert(`📄 Makale başarıyla yüklendi!\n📌 Takip Numaranız: ${result.tracking_number}`);
                setEmail('');
                setSelectedFile(null);
            } else {
                alert('❌ Yükleme başarısız. ' + (result.message || 'Lütfen tekrar deneyin.'));
            }
        } catch (error) {
            console.error('Yükleme hatası:', error);
            alert('Sunucuya bağlanılamadı.');
        }
    };


    const handleSendMessage = async () => {
        if (!email || emailError) {
            alert('Geçerli bir e-posta adresi girin.');
            return;
        }

        if (!message.trim()) {
            alert('Lütfen mesaj yazın.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8000/send_message/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: email, message: message }),
            });

            const result = await response.json();
            if (response.ok) {
                alert('Mesaj başarıyla gönderildi!');
                setEmail('');
                setMessage('');
            } else {
                alert('Gönderim hatası: ' + result.message);
            }
        } catch (error) {
            console.error('Gönderim hatası:', error);
            alert('Sunucuya ulaşılamadı.');
        }
    };



    return (
        <AppProvider
            navigation={NAVIGATION}
            router={router}
            theme={demoTheme}
            window={demoWindow}
            branding={{
                title: 'Yazar',
                logo: <img src="/yazar.png" alt="Yazar" onClick={() => router.navigate('/makalesistemi')} />,
            }}
        >
            <DashboardLayout>
                <PageContainer>
                    <Divider sx={{ mb: 5 }} />
                    {router.pathname.endsWith('/essay_upload') && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    error={emailError}
                                    helperText={emailHelperText}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    type="file"
                                    fullWidth
                                    variant="outlined"
                                    label="Makale dosyası"
                                    onChange={handleFileUpload}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={handleUpload}
                                >
                                    Makale Yükle
                                </Button>
                            </Grid>
                        </Grid>
                    )}

                    {router.pathname.endsWith('/messages') && (
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Email"
                                    value={email}
                                    onChange={handleEmailChange}
                                    error={emailError}
                                    helperText={emailHelperText}
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    label="Mesaj"
                                    multiline
                                    rows={4}
                                    value={message}  // 🔁 eksikti
                                    onChange={(e) => setMessage(e.target.value)}  // 🔁 eksikti
                                    placeholder="Mesajınızı buraya yazın..."
                                    InputLabelProps={{ shrink: true }}
                                />

                            </Grid>

                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SendIcon />}
                                    onClick={handleSendMessage}
                                >
                                    Mesaj Gönder
                                </Button>
                            </Grid>
                        </Grid>
                    )}
                </PageContainer>
            </DashboardLayout>
        </AppProvider>
    );
}
