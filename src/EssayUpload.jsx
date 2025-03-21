import * as React from 'react';
import { extendTheme } from '@mui/material/styles';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import { PageContainer } from '@toolpad/core/PageContainer';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import { colors, Divider } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload'; // Makale Yükleme için
import SendIcon from '@mui/icons-material/Send'; // Mesaj Gönderme için


const NAVIGATION = [
    {
        kind: 'header',
        title: 'Makale İşlemleri',
    },
    {
        segment: 'messages',
        title: 'Mesaj Gönderme',
        icon: <SendIcon />,
    },
    {
        segment: 'essay_upload',
        title: 'Makale Yükleme',
        icon: <CloudUploadIcon />,
    },
];

const demoTheme = extendTheme({
    colorSchemes: { light: true, dark: true },
    colorSchemeSelector: 'class',
    breakpoints: {
        values: {
            xs: 0,
            sm: 600,
            md: 600,
            lg: 1200,
            xl: 1536,
        },
    },
});

function useDemoRouter(initialPath) {
    const [pathname, setPathname] = React.useState(initialPath);

    const router = React.useMemo(() => {
        return {
            pathname,
            searchParams: new URLSearchParams(),
            navigate: (path) => setPathname(String(path)),
        };
    }, [pathname]);

    return router;
}

export default function EssayUpload(props) {
    const { window } = props;
    const router = useDemoRouter('/makalesistemi');
    const demoWindow = window ? window() : undefined;

    const [email, setEmail] = React.useState('');
    const [emailError, setEmailError] = React.useState(false);
    const [emailHelperText, setEmailHelperText] = React.useState('');

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Burada dosya yükleme işlemini gerçekleştirebilirsiniz.
            console.log('Selected file:', file);
        }
    };

    const validateEmail = (email) => {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basit bir e-posta regex'i
        return regex.test(email);
    };

    const handleEmailChange = (event) => {
        const value = event.target.value;
        setEmail(value);

        if (value === '') {
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
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    type="file"
                                    fullWidth
                                    variant="outlined"
                                    label="Makale dosyası"
                                    onChange={handleFileUpload}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<CloudUploadIcon />}
                                    onClick={() => {
                                        if (email && !emailError) {
                                            alert('Makale yüklendi!');
                                        } else {
                                            alert('Lütfen geçerli bir e-posta adresi girin.');
                                        }
                                    }}
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
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    type="file"
                                    fullWidth
                                    variant="outlined"
                                    label="Mesaj"
                                    onChange={handleFileUpload}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    multiline // Çok satırlı metin girişi için
                                    rows={4}
                                    placeholder="Mesajınızı buraya yazın..."
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SendIcon />}
                                    onClick={() => {
                                        if (email && !emailError) {
                                            alert('Mesaj gönderildi!');
                                        } else {
                                            alert('Lütfen geçerli bir e-posta adresi girin.');
                                        }
                                    }}
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