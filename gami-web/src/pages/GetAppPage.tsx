import { SiteContentPage } from '@/components/gami/SiteContentPage';

// TODO: replace with the real listing URLs once the Gami Wallet app is published.
const IOS_APP_STORE_URL = 'https://apps.apple.com/app/gami-wallet';
const ANDROID_PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.gami.wallet';

export function GetAppPage() {
  return (
    <SiteContentPage
      eyebrow="Gami Wallet"
      title="Get the App"
      description="The Gami Wallet lives on your phone — download it from the App Store or Google Play to start earning."
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <a
          href={IOS_APP_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="gami-gradient neo-border flex-1 px-8 py-4 text-center font-display text-lg font-bold uppercase tracking-wider shadow-brutal transition-all hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
        >
          App Store
        </a>
        <a
          href={ANDROID_PLAY_STORE_URL}
          target="_blank"
          rel="noreferrer"
          className="border-2 border-white px-8 py-4 text-center font-display text-lg font-bold uppercase tracking-wider transition-all hover:bg-white hover:text-black"
        >
          Google Play
        </a>
      </div>
    </SiteContentPage>
  );
}
