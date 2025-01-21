export const mapContainerStyle = {
  width: '100%',
  height: '100%',
}

export const defaultCenter = {
  lat: 39.0742,
  lng: 21.8243,
}

export const lightStyle = [
  {
    featureType: "all",
    elementType: "all",
    stylers: [
      {
        hue: "#008eff"
      }
    ]
  },
  {
    featureType: "poi",
    elementType: "all",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    featureType: "road",
    elementType: "all",
    stylers: [
      {
        saturation: "0"
      },
      {
        lightness: "0"
      }
    ]
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [
      {
        visibility: "off"
      }
    ]
  },
  {
    featureType: "water",
    elementType: "all",
    stylers: [
      {
        visibility: "simplified"
      },
      {
        saturation: "-60"
      },
      {
        lightness: "-20"
      }
    ]
  }
]

export const darkStyle = [
  {
    stylers: [
      {
        hue: "#ff1a00"
      },
      {
        invert_lightness: true
      },
      {
        saturation: -100
      },
      {
        lightness: 33
      },
      {
        gamma: 0.5
      }
    ]
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#2D333C"
      }
    ]
  }
] 